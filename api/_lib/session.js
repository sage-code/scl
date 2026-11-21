"use strict";

const crypto = require("crypto");
const { getDb, nowIso, isoAfter } = require("./db");
const { parseCookies, setCookie, HttpError } = require("./http");

const SESSION_COOKIE = "scl_sid";
const DAY_MS = 24 * 60 * 60 * 1000;
const SESSION_TTL_MS = 180 * DAY_MS;
const SCRYPT = { N: 16384, r: 8, p: 1, keyLength: 64 };

function newId() {
  return crypto.randomUUID();
}

function newToken() {
  return crypto.randomBytes(32).toString("base64url");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(String(token)).digest("hex");
}

function scrypt(password, salt, keyLength, options) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, options, (error, key) => (error ? reject(error) : resolve(key)));
  });
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(String(password), salt, SCRYPT.keyLength, { N: SCRYPT.N, r: SCRYPT.r, p: SCRYPT.p });
  return ["scrypt", SCRYPT.N, SCRYPT.r, SCRYPT.p, salt.toString("base64"), key.toString("base64")].join("$");
}

async function verifyPassword(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, N, r, p, saltB64, keyB64] = parts;
  const expected = Buffer.from(keyB64, "base64");
  const actual = await scrypt(String(password), Buffer.from(saltB64, "base64"), expected.length, {
    N: Number(N),
    r: Number(r),
    p: Number(p)
  });
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function publicUser(row) {
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    handle: row.handle || null,
    display_name: row.handle || null,
    email: row.email || null,
    avatar_url: row.avatar_url || null,
    is_anonymous: Number(row.is_anonymous) === 1,
    is_admin: Number(row.is_admin) === 1,
    email_verified: !!row.email_verified_at,
    created_at: row.created_at
  };
}

async function createSession(req, res, userId) {
  const token = newToken();
  await getDb().execute({
    sql: "insert into sessions (token_hash, user_id, created_at, expires_at) values (?, ?, ?, ?)",
    args: [hashToken(token), userId, nowIso(), isoAfter(SESSION_TTL_MS)]
  });
  setCookie(req, res, SESSION_COOKIE, token, SESSION_TTL_MS / 1000);
}

function clearSessionCookie(req, res) {
  setCookie(req, res, SESSION_COOKIE, "", 0);
}

// Returns { tokenHash, user } for a valid session cookie, or null.
async function readSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) {
    return null;
  }

  const tokenHash = hashToken(token);
  const result = await getDb().execute({
    sql: `select u.* from sessions s join users u on u.id = s.user_id
          where s.token_hash = ? and s.expires_at > ?`,
    args: [tokenHash, nowIso()]
  });

  const row = result.rows[0];
  if (!row) {
    return null;
  }

  // Track activity at most once a day so anonymous-user cleanup stays accurate
  // without a write on every request.
  if (!row.last_seen_at || Date.parse(row.last_seen_at) < Date.now() - DAY_MS) {
    await getDb().execute({ sql: "update users set last_seen_at = ? where id = ?", args: [nowIso(), row.id] });
  }

  return { tokenHash, user: row };
}

async function requireSession(req) {
  const session = await readSession(req);
  if (!session) {
    throw new HttpError(401, "No active session. Reload the page and try again.");
  }
  return session;
}

async function requireRegistered(req) {
  const session = await requireSession(req);
  if (Number(session.user.is_anonymous) === 1) {
    throw new HttpError(401, "Sign in to a registered account first.");
  }
  return session;
}

// Deletes a user and everything they own (explicit, so it does not depend on
// SQLite foreign-key enforcement being enabled on the connection).
function deleteUserStatements(userId) {
  return [
    { sql: "delete from community_members where user_id = ?", args: [userId] },
    { sql: "delete from quiz_attempts where user_id = ?", args: [userId] },
    { sql: "delete from roadmap_progress where user_id = ?", args: [userId] },
    { sql: "delete from roadmap_favorites where user_id = ?", args: [userId] },
    { sql: "delete from email_tokens where user_id = ?", args: [userId] },
    { sql: "delete from sessions where user_id = ?", args: [userId] },
    { sql: "delete from users where id = ?", args: [userId] }
  ];
}

module.exports = {
  DAY_MS,
  newId,
  newToken,
  hashToken,
  hashPassword,
  verifyPassword,
  publicUser,
  createSession,
  clearSessionCookie,
  readSession,
  requireSession,
  requireRegistered,
  deleteUserStatements
};
