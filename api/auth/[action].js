"use strict";

// /api/auth/<action> — one Vercel function for every auth action.
//
//   GET  session      current user (or null)
//   POST anonymous    ensure a user exists: creates an anonymous user + session
//   GET  check        ?handle=  is this username free? {available, error?}
//   POST register     {handle,email,password,website} upgrades the anonymous user in place
//                     ("website" is a honeypot that humans leave empty)
//   POST resend       re-sends the confirmation email to the signed-in, unconfirmed user
//   POST login        {email,password}; merges anonymous progress into the account
//   POST logout
//   GET  verify       ?token=  email confirmation link target (redirects)
//   POST forgot       {email} sends a reset link (always answers ok)
//   POST reset        {token,password}
//   POST profile      {handle?, password?}
//   POST delete       {password} (password not needed for anonymous users)

const crypto = require("node:crypto");
const { getDb, nowIso, isoAfter } = require("../_lib/db");
const { HttpError, sendJson, redirect, getQuery, readJson, clientIp, assertSameOriginJson, handle } = require("../_lib/http");
const S = require("../_lib/session");
const { siteUrl, sendTemplate } = require("../_lib/mail");

const HOUR_MS = 60 * 60 * 1000;
const HANDLE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.-]{2,31}$/;
const EMAIL_PATTERN = /^[^\s@]{1,64}@[^\s@]+\.[^\s@]{2,}$/;
const MIN_PASSWORD = 8;
const BOT_PATTERN = /bot|crawl|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pagespeed|monitor|curl|wget|python-requests/i;

// Per-IP limits (rolling one hour) that keep scripted sign-ups from filling the database.
const REGISTER_PER_IP_HOUR = 5;
const ANONYMOUS_PER_IP_HOUR = 30;

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

// Canonicalizes provider aliases (+tags, and dots / googlemail.com for Gmail)
// so one inbox cannot register multiple usernames.
function canonicalEmail(value) {
  const normalized = normalizeEmail(value);
  const at = normalized.lastIndexOf("@");
  if (at <= 0) {
    return normalized;
  }

  let local = normalized.slice(0, at);
  let domain = normalized.slice(at + 1);
  if (domain === "googlemail.com") {
    domain = "gmail.com";
  }

  const plus = local.indexOf("+");
  if (plus > 0) {
    local = local.slice(0, plus);
  }
  if (domain === "gmail.com") {
    local = local.replace(/\./g, "");
  }

  return `${local}@${domain}`;
}

// `related` holds values the password must not contain (username, email name).
function validatePassword(password, related) {
  if (typeof password !== "string" || password.length < MIN_PASSWORD) {
    throw new HttpError(400, `Password must be at least ${MIN_PASSWORD} characters.`);
  }
  if (password.length > 200) {
    throw new HttpError(400, "Password is too long.");
  }
  if (new Set(password).size < 4) {
    throw new HttpError(400, "Password is too simple. Use at least 4 different characters.");
  }

  const lower = password.toLowerCase();
  for (const value of related || []) {
    const word = String(value || "").toLowerCase();
    if (word.length >= 3 && lower.includes(word)) {
      throw new HttpError(400, "Password must not contain your username or email.");
    }
  }
}

async function assertIpLimit(req, kind, limit, message) {
  const ip = clientIp(req);
  if ((await countEvents(kind, ip, HOUR_MS)) >= limit) {
    throw new HttpError(429, message);
  }
  await logEvent(kind, ip);
}

function validateHandle(handleValue) {
  const value = String(handleValue || "").trim();
  if (!HANDLE_PATTERN.test(value)) {
    throw new HttpError(400, "Username must be 3-32 characters: letters, digits, dot, dash or underscore.");
  }
  return value;
}

async function countEvents(kind, subject, sinceMs) {
  const result = await getDb().execute({
    sql: "select count(*) as n from auth_events where kind = ? and subject = ? and created_at > ?",
    args: [kind, subject, new Date(Date.now() - sinceMs).toISOString()]
  });
  return Number(result.rows[0].n);
}

async function logEvent(kind, subject) {
  await getDb().execute({ sql: "insert into auth_events (kind, subject, created_at) values (?, ?, ?)", args: [kind, subject, nowIso()] });
}

async function findUserByEmail(email) {
  const exact = await getDb().execute({ sql: "select * from users where email = ? limit 1", args: [email] });
  if (exact.rows[0]) {
    return exact.rows[0];
  }
  const canonical = canonicalEmail(email);
  const byCanonical = await getDb().execute({
    sql: "select * from users where email_canonical = ? or email = ? limit 1",
    args: [canonical, canonical]
  });
  return byCanonical.rows[0] || null;
}

async function findUserByCanonicalEmail(email, canonical) {
  const result = await getDb().execute({
    sql: "select id from users where email_canonical = ? or email = ? or email = ? limit 1",
    args: [canonical, email, canonical]
  });
  return result.rows[0] || null;
}

async function handleTaken(handleValue, exceptUserId) {
  const result = await getDb().execute({
    sql: "select id from users where handle = ? and id != ?",
    args: [handleValue, exceptUserId || ""]
  });
  return result.rows.length > 0;
}

async function generateUniqueHandle() {
  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = String(crypto.randomInt(10000, 100000));
    if (!(await handleTaken(candidate, ""))) {
      return candidate;
    }
  }
  return crypto.randomBytes(3).toString("hex");
}

// Creates a one-time token and emails it. At most 3 of each kind per user per hour.
async function sendTokenEmail(req, user, purpose) {
  const kind = `email:${purpose}`;
  if ((await countEvents(kind, user.id, HOUR_MS)) >= 3) {
    return { ok: false, rateLimited: true, error: "Too many emails requested. Try again in an hour." };
  }

  const token = S.newToken();
  const tokenHash = S.hashToken(token);
  const ttl = purpose === "verify" ? 24 * HOUR_MS : HOUR_MS;
  await getDb().execute({
    sql: "insert into email_tokens (token_hash, user_id, purpose, created_at, expires_at) values (?, ?, ?, ?, ?)",
    args: [tokenHash, user.id, purpose, nowIso(), isoAfter(ttl)]
  });

  const base = siteUrl(req);
  const isLocal = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(base);
  const resetPath = isLocal ? "/roadmaps/reset-password.html" : "/roadmaps/reset-password/";
  const link = purpose === "verify"
    ? `${base}/api/auth/verify/?token=${encodeURIComponent(token)}`
    : `${base}${resetPath}?token=${encodeURIComponent(token)}`;

  const result = await sendTemplate(purpose, user.email, user.handle, link, `${purpose}-${tokenHash.slice(0, 32)}`);
  if (result.ok) {
    await logEvent(kind, user.id);
  }
  return result;
}

// Validates an unused token without marking it used yet (for atomic batch consumption).
async function peekToken(token, purpose) {
  if (!token || typeof token !== "string") {
    throw new HttpError(400, "This link is invalid or has expired.");
  }

  const tokenHash = S.hashToken(token);
  const result = await getDb().execute({
    sql: "select user_id from email_tokens where token_hash = ? and purpose = ? and used_at is null and expires_at > ?",
    args: [tokenHash, purpose, nowIso()]
  });
  const row = result.rows[0];
  if (!row) {
    throw new HttpError(400, "This link is invalid or has expired.");
  }
  return { userId: row.user_id, tokenHash };
}

// Consumes a valid unused token; returns the user id or throws.
async function consumeToken(token, purpose) {
  const { userId, tokenHash } = await peekToken(token, purpose);
  await getDb().execute({ sql: "update email_tokens set used_at = ? where token_hash = ?", args: [nowIso(), tokenHash] });
  return userId;
}

// Removes expired rows and long-idle anonymous users. Runs on a small fraction
// of anonymous sign-ups so no cron job is needed.
async function maybeCleanup() {
  if (Math.random() > 0.02) {
    return;
  }

  const now = nowIso();
  const staleAnon = new Date(Date.now() - 180 * S.DAY_MS).toISOString();
  const oldEvents = new Date(Date.now() - 7 * S.DAY_MS).toISOString();
  const db = getDb();
  await db.batch([
    { sql: "delete from sessions where expires_at < ?", args: [now] },
    { sql: "delete from email_tokens where expires_at < ?", args: [now] },
    { sql: "delete from auth_events where created_at < ?", args: [oldEvents] },
    { sql: "delete from roadmap_progress where user_id in (select id from users where is_anonymous = 1 and last_seen_at < ?)", args: [staleAnon] },
    { sql: "delete from roadmap_favorites where user_id in (select id from users where is_anonymous = 1 and last_seen_at < ?)", args: [staleAnon] },
    { sql: "delete from quiz_attempts where user_id in (select id from users where is_anonymous = 1 and last_seen_at < ?)", args: [staleAnon] },
    { sql: "delete from users where is_anonymous = 1 and last_seen_at < ? and id not in (select user_id from sessions)", args: [staleAnon] }
  ], "write");
}

const actions = {
  async session(req, res) {
    const session = await S.readSession(req);
    if (session && !session.user.handle) {
      const generated = await generateUniqueHandle();
      await getDb().execute({
        sql: "update users set handle = ?, updated_at = ? where id = ? and handle is null",
        args: [generated, nowIso(), session.user.id]
      });
      const refreshed = await getDb().execute({ sql: "select * from users where id = ?", args: [session.user.id] });
      sendJson(res, 200, { user: S.publicUser(refreshed.rows[0] || session.user) });
      return;
    }
    sendJson(res, 200, { user: S.publicUser(session && session.user) });
  },

  async anonymous(req, res) {
    assertSameOriginJson(req);
    const session = await S.readSession(req);
    if (session) {
      if (!session.user.handle) {
        const generated = await generateUniqueHandle();
        await getDb().execute({
          sql: "update users set handle = ?, updated_at = ? where id = ? and handle is null",
          args: [generated, nowIso(), session.user.id]
        });
        const refreshed = await getDb().execute({ sql: "select * from users where id = ?", args: [session.user.id] });
        sendJson(res, 200, { user: S.publicUser(refreshed.rows[0] || session.user) });
        return;
      }
      sendJson(res, 200, { user: S.publicUser(session.user) });
      return;
    }

    if (BOT_PATTERN.test(String(req.headers["user-agent"] || ""))) {
      sendJson(res, 200, { user: null });
      return;
    }
    await assertIpLimit(req, "anonymous-ip", ANONYMOUS_PER_IP_HOUR, "Too many new sessions from this network. Try again later.");

    const id = S.newId();
    const inventedHandle = await generateUniqueHandle();
    const now = nowIso();
    await getDb().execute({
      sql: "insert into users (id, handle, is_anonymous, created_at, updated_at, last_seen_at) values (?, ?, 1, ?, ?, ?)",
      args: [id, inventedHandle, now, now, now]
    });
    await S.createSession(req, res, id);
    await maybeCleanup().catch((error) => console.warn("[auth] cleanup failed:", error.message));

    const created = await getDb().execute({ sql: "select * from users where id = ?", args: [id] });
    sendJson(res, 201, { user: S.publicUser(created.rows[0]) });
  },

  async check(req, res) {
    const value = String(getQuery(req).handle || "").trim();
    if (!HANDLE_PATTERN.test(value)) {
      sendJson(res, 200, { available: false, error: "3-32 characters: letters, digits, dot, dash or underscore." });
      return;
    }

    const session = await S.readSession(req);
    sendJson(res, 200, { available: !(await handleTaken(value, session && session.user.id)) });
  },

  async register(req, res) {
    assertSameOriginJson(req);
    const body = await readJson(req);
    if (String(body.website || "").trim() !== "") {
      throw new HttpError(400, "Registration failed. Reload the page and try again.");
    }

    const handleValue = validateHandle(body.handle);
    const email = normalizeEmail(body.email);
    if (!EMAIL_PATTERN.test(email) || email.length > 254) {
      throw new HttpError(400, "Enter a valid email address.");
    }
    const emailCanonical = canonicalEmail(email);
    validatePassword(body.password, [handleValue, email.split("@")[0]]);

    const session = await S.readSession(req);
    if (session && Number(session.user.is_anonymous) !== 1) {
      throw new HttpError(409, "You are already signed in. Log out before creating another account.");
    }
    await assertIpLimit(req, "register-ip", REGISTER_PER_IP_HOUR, "Too many sign-up attempts from this network. Try again in an hour.");
    if (await handleTaken(handleValue, session && session.user.id)) {
      throw new HttpError(409, "Username already exists. Choose another.");
    }
    if (await findUserByCanonicalEmail(email, emailCanonical)) {
      throw new HttpError(409, "An account with this email already exists. Sign in or reset the password.");
    }

    const passwordHash = await S.hashPassword(body.password);
    const now = nowIso();
    const db = getDb();
    let userId;

    try {
      if (session) {
        // Upgrade the anonymous user in place so its progress is kept.
        userId = session.user.id;
        await db.execute({
          sql: "update users set handle = ?, email = ?, email_canonical = ?, password_hash = ?, is_anonymous = 0, updated_at = ? where id = ?",
          args: [handleValue, email, emailCanonical, passwordHash, now, userId]
        });
      } else {
        userId = S.newId();
        await db.execute({
          sql: `insert into users (id, handle, email, email_canonical, password_hash, is_anonymous, created_at, updated_at, last_seen_at)
                values (?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          args: [userId, handleValue, email, emailCanonical, passwordHash, now, now, now]
        });
        await S.createSession(req, res, userId);
      }
    } catch (error) {
      if (/UNIQUE/i.test(error.message)) {
        throw new HttpError(409, "That username or email was just taken. Choose another.");
      }
      throw error;
    }

    const user = (await db.execute({ sql: "select * from users where id = ?", args: [userId] })).rows[0];
    const mail = await sendTokenEmail(req, user, "verify");
    sendJson(res, 201, { user: S.publicUser(user), email_sent: mail.ok, email_error: mail.ok ? undefined : mail.error });
  },

  async resend(req, res) {
    assertSameOriginJson(req);
    const session = await S.requireRegistered(req);
    if (session.user.email_verified_at) {
      sendJson(res, 200, { email_sent: false, already_verified: true });
      return;
    }

    const mail = await sendTokenEmail(req, session.user, "verify");
    if (!mail.ok && mail.error) {
      throw new HttpError(429, mail.error);
    }
    sendJson(res, 200, { email_sent: mail.ok });
  },

  async login(req, res) {
    assertSameOriginJson(req);
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!email || !password) {
      throw new HttpError(400, "Email and password are required.");
    }

    if ((await countEvents("login-fail", email, 15 * 60 * 1000)) >= 10) {
      throw new HttpError(429, "Too many failed attempts. Wait 15 minutes or reset your password.");
    }

    const user = await findUserByEmail(email);
    const valid = user && user.password_hash ? await S.verifyPassword(password, user.password_hash) : false;
    if (!valid) {
      await logEvent("login-fail", email);
      throw new HttpError(401, "Invalid email or password.");
    }

    if (!user.email_verified_at) {
      const mail = await sendTokenEmail(req, user, "verify");
      throw new HttpError(403, mail.ok
        ? "Confirm your email first. We sent you a new confirmation link."
        : "Confirm your email first using the link we sent when you registered.");
    }

    const db = getDb();
    const current = await S.readSession(req);
    const statements = [];

    if (current) {
      statements.push({ sql: "delete from sessions where token_hash = ?", args: [current.tokenHash] });

      // Carry anonymous progress into the account; existing account rows win.
      if (Number(current.user.is_anonymous) === 1 && current.user.id !== user.id) {
        const anonId = current.user.id;
        statements.push(
          {
            sql: "update users set avatar_url = coalesce(avatar_url, ?), avatar_path = coalesce(avatar_path, ?) where id = ?",
            args: [current.user.avatar_url || null, current.user.avatar_path || null, user.id]
          },
          {
            sql: `insert into roadmap_progress (user_id, roadmap_code, topic_key, status, progress_percent, created_at, updated_at)
                  select ?, roadmap_code, topic_key, status, progress_percent, created_at, updated_at
                  from roadmap_progress where user_id = ? on conflict do nothing`,
            args: [user.id, anonId]
          },
          {
            sql: `insert into roadmap_favorites (user_id, roadmap_code, topic_key, category, created_at, updated_at)
                  select ?, roadmap_code, topic_key, category, created_at, updated_at
                  from roadmap_favorites where user_id = ? on conflict do nothing`,
            args: [user.id, anonId]
          },
          {
            sql: `insert into quiz_attempts
                    (id, user_id, quiz_id, track, topic, level, revision, points_earned, points_possible, score_percent, status, completed_at)
                  select id, ?, quiz_id, track, topic, level, revision, points_earned, points_possible, score_percent, status, completed_at
                  from quiz_attempts where user_id = ? on conflict do nothing`,
            args: [user.id, anonId]
          },
          ...S.deleteUserStatements(anonId)
        );
      }
    }

    statements.push({ sql: "update users set last_seen_at = ? where id = ?", args: [nowIso(), user.id] });
    await db.batch(statements, "write");
    await S.createSession(req, res, user.id);
    sendJson(res, 200, { user: S.publicUser(user) });
  },

  async logout(req, res) {
    assertSameOriginJson(req);
    const session = await S.readSession(req);
    if (session) {
      await getDb().execute({ sql: "delete from sessions where token_hash = ?", args: [session.tokenHash] });
    }
    S.clearSessionCookie(req, res);
    sendJson(res, 200, { ok: true });
  },

  async verify(req, res) {
    const { token } = getQuery(req);
    let userId;
    try {
      userId = await consumeToken(token, "verify");
    } catch (error) {
      if (error instanceof HttpError) {
        redirect(res, "/roadmaps/login.html?verified=0");
        return;
      }
      throw error;
    }

    const now = nowIso();
    await getDb().execute({
      sql: "update users set email_verified_at = coalesce(email_verified_at, ?), updated_at = ? where id = ?",
      args: [now, now, userId]
    });

    try {
      const db = getDb();
      const userRes = await db.execute({
        sql: "select id, handle, avatar_url, avatar_path from users where id = ?",
        args: [userId]
      });
      const verifiedUser = userRes.rows[0];
      if (verifiedUser) {
        const existingMember = await db.execute({
          sql: "select user_id from community_members where user_id = ?",
          args: [userId]
        });
        if (existingMember.rows.length === 0) {
          const basePublicId = (verifiedUser.handle || "").replace(/^Learner-/i, "").trim() || crypto.randomBytes(6).toString("hex");
          const clash = await db.execute({
            sql: "select user_id from community_members where public_id = ?",
            args: [basePublicId]
          });
          const publicId = clash.rows.length === 0 ? basePublicId : `${basePublicId}-${crypto.randomBytes(3).toString("hex")}`;
          const displayName = (verifiedUser.handle || "").replace(/^Learner-/i, "").trim() || publicId;
          await db.execute({
            sql: `insert into community_members
                    (user_id, public_id, display_name, avatar_url, avatar_path, bio, projects_json,
                     contact_json, paragraphs_json, role, qualified_track, qualified_topic,
                     is_published, is_legacy_verified, created_at, updated_at)
                  values (?, ?, ?, ?, ?, '', '[]', '{}', '[]', 'Student', '', '', 0, 0, ?, ?)`,
            args: [
              userId,
              publicId,
              displayName,
              verifiedUser.avatar_url || null,
              verifiedUser.avatar_path || null,
              now,
              now
            ]
          });
        }
      }
    } catch (_error) {
      // Minimal test schemas may omit community_members.
    }

    const session = await S.readSession(req);
    redirect(res, session && session.user.id === userId ? "/roadmaps/?verified=1" : "/roadmaps/login.html?verified=1");
  },

  async forgot(req, res) {
    assertSameOriginJson(req);
    const body = await readJson(req);
    const email = normalizeEmail(body.email);
    if (!EMAIL_PATTERN.test(email)) {
      throw new HttpError(400, "Enter a valid email address.");
    }

    const user = await findUserByEmail(email);
    if (user && Number(user.is_anonymous) !== 1) {
      const mail = await sendTokenEmail(req, user, "reset");
      if (!mail.ok) {
        console.error("[auth/forgot] reset email failed:", mail.error);
        if (mail.rateLimited) {
          throw new HttpError(429, mail.error);
        }
        throw new HttpError(502, mail.error || "Could not send the reset email. Please try again later.");
      }
    }

    // Same answer whether or not the account exists, to avoid email enumeration.
    sendJson(res, 200, { ok: true });
  },

  async reset(req, res) {
    assertSameOriginJson(req);
    const body = await readJson(req);
    validatePassword(body.password);
    const { userId, tokenHash } = await peekToken(body.token, "reset");
    const passwordHash = await S.hashPassword(body.password);
    const now = nowIso();

    // The reset link proves email ownership, so it also confirms the email.
    // Mark the token used atomically in the same batch as updating the password.
    const db = getDb();
    await db.batch([
      {
        sql: "update users set password_hash = ?, email_verified_at = coalesce(email_verified_at, ?), updated_at = ?, last_seen_at = ? where id = ?",
        args: [passwordHash, now, now, now, userId]
      },
      { sql: "update email_tokens set used_at = ? where token_hash = ?", args: [now, tokenHash] },
      { sql: "delete from sessions where user_id = ?", args: [userId] }
    ], "write");

    await S.createSession(req, res, userId);

    let updated;
    try {
      updated = (await db.execute({
        sql: `select u.*,
                     c.role as community_role,
                     c.public_id as community_public_id,
                     c.country_code as community_country_code,
                     coalesce(u.avatar_url, c.avatar_url) as avatar_url
              from users u
              left join community_members c on c.user_id = u.id
              where u.id = ?`,
        args: [userId]
      })).rows[0];
    } catch (_error) {
      updated = (await db.execute({ sql: "select * from users where id = ?", args: [userId] })).rows[0];
    }
    sendJson(res, 200, { ok: true, user: S.publicUser(updated) });
  },

  async profile(req, res) {
    assertSameOriginJson(req);
    const session = await S.requireSession(req);
    const body = await readJson(req);
    const user = session.user;
    const db = getDb();
    const statements = [];
    const now = nowIso();

    if (body.handle !== undefined && String(body.handle).trim() !== String(user.handle || "")) {
      const handleValue = validateHandle(body.handle);
      if (await handleTaken(handleValue, user.id)) {
        throw new HttpError(409, "Username already exists. Choose another.");
      }
      statements.push({ sql: "update users set handle = ?, updated_at = ? where id = ?", args: [handleValue, now, user.id] });
    }

    if (body.password) {
      if (Number(user.is_anonymous) === 1) {
        throw new HttpError(403, "Register an account with an email address before setting a password.");
      }
      validatePassword(body.password, [String(body.handle || "").trim() || user.handle, String(user.email || "").split("@")[0]]);
      const passwordHash = await S.hashPassword(body.password);
      statements.push(
        { sql: "update users set password_hash = ?, updated_at = ? where id = ?", args: [passwordHash, now, user.id] },
        // Sign out other devices; keep this session.
        { sql: "delete from sessions where user_id = ? and token_hash != ?", args: [user.id, session.tokenHash] }
      );
    }

    if (body.country_code !== undefined) {
      if (Number(user.is_anonymous) === 1) {
        throw new HttpError(403, "Sign in with a registered account before setting your country of origin.");
      }
      const rawCountry = String(body.country_code || "").trim().toUpperCase();
      if (rawCountry && !/^[A-Z]{2}$/.test(rawCountry)) {
        throw new HttpError(400, "Country of origin must be a 2-letter ISO code (e.g. US, GB, RO).");
      }
      statements.push({
        sql: "update community_members set country_code = ?, updated_at = ? where user_id = ?",
        args: [rawCountry || null, now, user.id]
      });
    }

    if (statements.length === 0) {
      throw new HttpError(400, "No changes to save.");
    }

    try {
      await db.batch(statements, "write");
    } catch (error) {
      if (/UNIQUE/i.test(error.message)) {
        throw new HttpError(409, "Username already exists. Choose another.");
      }
      throw error;
    }

    let updated;
    try {
      updated = (await db.execute({
        sql: `select u.*,
                     c.role as community_role,
                     c.public_id as community_public_id,
                     c.country_code as community_country_code,
                     coalesce(u.avatar_url, c.avatar_url) as avatar_url
              from users u
              left join community_members c on c.user_id = u.id
              where u.id = ?`,
        args: [user.id]
      })).rows[0];
    } catch (_error) {
      updated = (await db.execute({ sql: "select * from users where id = ?", args: [user.id] })).rows[0];
    }
    sendJson(res, 200, { user: S.publicUser(updated) });
  },

  async delete(req, res) {
    assertSameOriginJson(req);
    const session = await S.requireSession(req);
    const body = await readJson(req);
    const user = session.user;

    if (Number(user.is_anonymous) !== 1) {
      const valid = await S.verifyPassword(typeof body.password === "string" ? body.password : "", user.password_hash);
      if (!valid) {
        throw new HttpError(401, "Password is incorrect.");
      }
    }

    let avatarUrl = null;
    const userAvatarUrl = user.avatar_url || null;
    const mediaToken = String(process.env.MEDIA_READ_WRITE_TOKEN || "").trim();
    if (Number(user.is_anonymous) !== 1 && mediaToken) {
      const memberRes = await getDb().execute({
        sql: "select avatar_url from community_members where user_id = ?",
        args: [user.id]
      });
      avatarUrl = memberRes.rows[0] && memberRes.rows[0].avatar_url;
    }

    await getDb().batch(S.deleteUserStatements(user.id), "write");
    for (const blobUrl of [avatarUrl, userAvatarUrl]) {
      if (blobUrl && mediaToken) {
        try {
          const { del } = require("@vercel/blob");
          await del(blobUrl, { token: mediaToken });
        } catch (error) {
          console.error("[auth/delete] failed to remove avatar:", error.message);
        }
      }
    }
    S.clearSessionCookie(req, res);
    sendJson(res, 200, { ok: true });
  }
};

const GET_ACTIONS = new Set(["session", "verify", "check"]);

module.exports = handle(async (req, res) => {
  const query = getQuery(req);
  const action = String(query.action || "").replace(/\/+$/, "");
  const fn = Object.prototype.hasOwnProperty.call(actions, action) ? actions[action] : null;
  if (!fn) {
    throw new HttpError(404, "Unknown auth action.");
  }

  const expected = GET_ACTIONS.has(action) ? "GET" : "POST";
  if (req.method !== expected) {
    throw new HttpError(405, "Method not allowed.");
  }

  await fn(req, res);
});
