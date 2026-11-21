"use strict";

const crypto = require("node:crypto");
const { getDb, nowIso } = require("./db");
const { HttpError } = require("./http");
const { qualifiedRoadmaps } = require("./quiz");

const MAX_BIO_LENGTH = 500;
const MAX_PROJECTS = 5;
const MAX_PROJECT_DESC = 200;
const MAX_PARAGRAPHS = 5;
const MAX_PARAGRAPH_HEADING = 80;
const MAX_PARAGRAPH_BODY = 1000;

const TRACK_LABELS = {
  ada: "Ada", assembly: "Assembly", bash: "Bash", c: "C", cpp: "C++",
  cse: "CSE", csharp: "C#", css: "CSS", dart: "Dart", dba: "DBA",
  dsa: "DSA", dsl: "DSL", elixir: "Elixir", flutter: "Flutter",
  fortran: "Fortran", go: "Go", hpc: "HPC", html: "HTML", java: "Java",
  javascript: "JavaScript", julia: "Julia", kotlin: "Kotlin", nim: "Nim",
  node: "Node.js", odin: "Odin", osd: "OSD", pgp: "PGP", php: "PHP",
  plsql: "PL/SQL", python: "Python", react: "React", ruby: "Ruby",
  rust: "Rust", scala: "Scala", sml: "SML", svelte: "Svelte",
  swift: "Swift", tek: "TechOps", tscript: "TypeScript", vue: "Vue",
  wasm: "WebAssembly", zig: "Zig"
};

function trackLabel(track) {
  return TRACK_LABELS[track] || track;
}

function validateHttpsUrl(raw, label) {
  const href = typeof raw === "string" ? raw.trim() : "";
  if (href.length > 500) {
    throw new HttpError(400, `${label} must be 500 characters or fewer.`);
  }
  let url;
  try {
    url = new URL(href);
  } catch (_error) {
    throw new HttpError(400, `${label} must be a valid HTTPS URL.`);
  }
  if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
    throw new HttpError(400, `${label} must use HTTPS and cannot include credentials.`);
  }
  return url.toString();
}

function validateContact(rawContact) {
  if (rawContact === undefined) {
    return undefined;
  }
  if (!rawContact || typeof rawContact !== "object" || Array.isArray(rawContact)) {
    throw new HttpError(400, "Contact information must be an object.");
  }
  const contact = {};
  const urlFields = [
    ["website", "Website URL"],
    ["github", "GitHub URL"],
    ["linkedin", "LinkedIn URL"],
    ["x", "X URL"],
    ["bluesky", "Bluesky URL"]
  ];
  for (const [key, label] of urlFields) {
    const val = typeof rawContact[key] === "string" ? rawContact[key].trim() : "";
    if (val) {
      contact[key] = validateHttpsUrl(val, label);
    }
  }
  if (typeof rawContact.discord === "string" && rawContact.discord.trim()) {
    const discord = rawContact.discord.trim();
    if (discord.length > 80) {
      throw new HttpError(400, "Discord handle must be 80 characters or fewer.");
    }
    contact.discord = discord;
  }
  if (typeof rawContact.email === "string" && rawContact.email.trim()) {
    const email = rawContact.email.trim();
    if (email.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new HttpError(400, "Public contact email must be a valid email address.");
    }
    contact.email = email;
  }
  return contact;
}

function validateParagraphs(rawParagraphs) {
  if (rawParagraphs === undefined) {
    return undefined;
  }
  if (!Array.isArray(rawParagraphs) || rawParagraphs.length > MAX_PARAGRAPHS) {
    throw new HttpError(400, `Provide no more than ${MAX_PARAGRAPHS} text paragraphs.`);
  }
  return rawParagraphs.map((item) => {
    if (!item || typeof item !== "object") {
      throw new HttpError(400, "Each text paragraph must be an object.");
    }
    const heading = typeof item.heading === "string" ? item.heading.trim() : "";
    const body = typeof item.body === "string" ? item.body.trim() : "";
    if (heading.length > MAX_PARAGRAPH_HEADING) {
      throw new HttpError(400, `Paragraph heading must be ${MAX_PARAGRAPH_HEADING} characters or fewer.`);
    }
    if (!body || body.length > MAX_PARAGRAPH_BODY) {
      throw new HttpError(400, `Each text paragraph must be 1 to ${MAX_PARAGRAPH_BODY} characters.`);
    }
    return heading ? { heading, body } : { body };
  });
}

function validateProfile(body) {
  const displayName = typeof body.display_name === "string" ? body.display_name.trim() : "";
  if (displayName.length < 2 || displayName.length > 80) {
    throw new HttpError(400, "Display name must be 2 to 80 characters.");
  }

  const bio = typeof body.bio === "string" ? body.bio.trim() : "";
  if (bio.length > MAX_BIO_LENGTH) {
    throw new HttpError(400, `Bio must be ${MAX_BIO_LENGTH} characters or fewer.`);
  }

  let countryCode = null;
  if (body.country_code !== undefined && body.country_code !== null && body.country_code !== "") {
    countryCode = String(body.country_code).trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(countryCode)) {
      throw new HttpError(400, "Country code must use two ISO letters, such as US or GB.");
    }
  }

  if (!Array.isArray(body.projects) || body.projects.length > MAX_PROJECTS) {
    throw new HttpError(400, `Provide no more than ${MAX_PROJECTS} project links.`);
  }
  const projects = body.projects.map((project) => {
    const name = typeof project.name === "string" ? project.name.trim() : "";
    const href = typeof project.url === "string" ? project.url.trim() : "";
    const description = typeof project.description === "string" ? project.description.trim() : "";
    if (!name || name.length > 80 || href.length > 500) {
      throw new HttpError(400, "Each project needs a name of at most 80 characters and a valid HTTPS URL.");
    }
    if (description.length > MAX_PROJECT_DESC) {
      throw new HttpError(400, `Project description must be ${MAX_PROJECT_DESC} characters or fewer.`);
    }
    const url = validateHttpsUrl(href, "Project link");
    return description ? { name, url, description } : { name, url };
  });

  if (typeof body.publish !== "boolean") {
    throw new HttpError(400, "Choose whether to publish your community profile.");
  }

  return {
    displayName,
    bio,
    countryCode,
    projects,
    contact: validateContact(body.contact),
    paragraphs: validateParagraphs(body.paragraphs),
    publish: body.publish
  };
}

async function getQualifiedTracks(user) {
  if (!user || Number(user.is_anonymous) === 1 || !user.email_verified_at) {
    return [];
  }
  const result = await getDb().execute({
    sql: "select quiz_id, revision, status from quiz_attempts where user_id = ?",
    args: [user.id]
  });
  return qualifiedRoadmaps(result.rows);
}

async function getMember(userId) {
  const result = await getDb().execute({
    sql: `select public_id, display_name, avatar_url, bio, country_code, projects_json,
                 contact_json, paragraphs_json,
                 qualified_track, qualified_topic, is_published, claimed_at, created_at, updated_at,
                 role, certification_label, certificate_url, member_since, is_legacy_verified
          from community_members where user_id = ?`,
    args: [userId]
  });
  const member = memberFromRow(result.rows[0]);
  if (!member) {
    return null;
  }
  const attemptsResult = await getDb().execute({
    sql: "select quiz_id, revision, status from quiz_attempts where user_id = ?",
    args: [userId]
  });
  const qualifiedTracks = qualifiedRoadmaps(attemptsResult.rows);
  member.certificates = buildCertificates(result.rows[0], qualifiedTracks);
  return member;
}

function parseJsonObject(raw, label) {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`Stored ${label} is invalid JSON: ${error.message}`);
  }
}

function parseJsonArray(raw, label) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON array.`);
    }
    return parsed;
  } catch (error) {
    throw new Error(`Stored ${label} is invalid JSON: ${error.message}`);
  }
}

function buildCertificates(row, qualifiedTracks) {
  const certificates = [];
  if (row && row.certificate_url) {
    certificates.push({
      track: row.qualified_track || null,
      topic: row.qualified_topic || null,
      title: row.certification_label || "Certificate of Completion",
      url: row.certificate_url
    });
  }
  for (const qt of qualifiedTracks || []) {
    certificates.push({
      track: qt.track,
      topic: qt.topic,
      title: `${trackLabel(qt.track)} Roadmap Certificate`,
      url: `/roadmap/${encodeURIComponent(qt.track)}/`
    });
  }
  return certificates;
}

function memberFromRow(row) {
  if (!row) {
    return null;
  }
  const projects = parseJsonArray(row.projects_json, "community projects");
  const contact = parseJsonObject(row.contact_json, "community contact");
  const paragraphs = parseJsonArray(row.paragraphs_json, "community paragraphs");
  return {
    public_id: row.public_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    country_code: row.country_code,
    projects,
    contact,
    paragraphs,
    qualified_track: row.qualified_track,
    qualified_topic: row.qualified_topic,
    role: row.role || "VCP Graduate",
    certification_label: row.certification_label || null,
    certificate_url: row.certificate_url || null,
    member_since: row.member_since != null ? Number(row.member_since) : null,
    is_legacy_verified: Number(row.is_legacy_verified) === 1,
    published: Number(row.is_published) === 1,
    claimed_at: row.claimed_at,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

function publicMemberFromRow(row, qualifiedTracks) {
  const member = memberFromRow(row);
  if (!member) {
    return null;
  }
  return {
    public_id: member.public_id,
    display_name: member.display_name,
    avatar_url: member.avatar_url,
    bio: member.bio,
    country_code: member.country_code,
    projects: member.projects,
    contact: member.contact,
    paragraphs: member.paragraphs,
    qualified_track: member.qualified_track,
    qualified_topic: member.qualified_topic,
    role: member.role,
    certification_label: member.certification_label,
    certificate_url: member.certificate_url,
    certificates: buildCertificates(row, qualifiedTracks),
    member_since: member.member_since,
    is_legacy_verified: member.is_legacy_verified,
    claimed_at: member.claimed_at
  };
}

async function getPublicMemberWithOwnership(publicId, viewerUserId) {
  const result = await getDb().execute({
    sql: `select c.user_id, u.email_verified_at, u.is_anonymous, c.public_id, c.display_name,
                 c.avatar_url, c.bio, c.country_code, c.projects_json, c.contact_json, c.paragraphs_json,
                 c.qualified_track, c.qualified_topic, c.is_published, c.claimed_at, c.created_at, c.updated_at,
                 c.role, c.certification_label, c.certificate_url, c.member_since, c.is_legacy_verified
          from community_members c
          join users u on u.id = c.user_id
          where c.public_id = ? and c.is_published = 1
            and u.is_anonymous = 0
            and (c.is_legacy_verified = 1 or u.email_verified_at is not null)`,
    args: [publicId]
  });
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  const isOwner = Boolean(viewerUserId && row.user_id === viewerUserId);
  const qualifiedTracks = await getQualifiedTracks({
    id: row.user_id,
    is_anonymous: row.is_anonymous,
    email_verified_at: row.email_verified_at
  });
  if (Number(row.is_legacy_verified) === 1) {
    return { profile: publicMemberFromRow(row, qualifiedTracks), is_owner: isOwner };
  }

  const qualified = qualifiedTracks.some((track) => track.track === row.qualified_track && track.topic === row.qualified_topic);
  return qualified ? { profile: publicMemberFromRow(row, qualifiedTracks), is_owner: isOwner } : null;
}

async function getPublicMember(publicId) {
  const result = await getPublicMemberWithOwnership(publicId, null);
  return result ? result.profile : null;
}

async function listPublishedMembers() {
  const result = await getDb().execute({
    sql: `select c.user_id, u.email_verified_at, c.public_id, c.display_name, c.avatar_url,
                 c.country_code, c.qualified_track, c.qualified_topic, c.claimed_at,
                 c.role, c.certification_label, c.member_since, c.is_legacy_verified,
                 q.quiz_id, q.revision, q.status
          from community_members c
          join users u on u.id = c.user_id
          left join quiz_attempts q on q.user_id = c.user_id
          where c.is_published = 1 and u.is_anonymous = 0
            and (c.is_legacy_verified = 1 or u.email_verified_at is not null)
          order by c.claimed_at desc, c.display_name collate nocase`
  });
  const grouped = new Map();
  for (const row of result.rows) {
    let member = grouped.get(row.user_id);
    if (!member) {
      member = { row, attempts: [] };
      grouped.set(row.user_id, member);
    }
    if (row.quiz_id) {
      member.attempts.push({ quiz_id: row.quiz_id, revision: row.revision, status: row.status });
    }
  }

  return [...grouped.values()]
    .filter(({ row, attempts }) => Number(row.is_legacy_verified) === 1
      || qualifiedRoadmaps(attempts).some((track) => track.track === row.qualified_track && track.topic === row.qualified_topic))
    .map(({ row }) => ({
      public_id: row.public_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      country_code: row.country_code,
      qualified_track: row.qualified_track,
      qualified_topic: row.qualified_topic,
      role: row.role || "VCP Graduate",
      certification_label: row.certification_label || null,
      member_since: row.member_since != null ? Number(row.member_since) : null,
      is_legacy_verified: Number(row.is_legacy_verified) === 1,
      claimed_at: row.claimed_at
    }));
}

async function saveMember(userId, profile, qualifiedTrack) {
  const now = nowIso();
  const publicId = crypto.randomBytes(18).toString("base64url");
  const contactArg = profile.contact !== undefined ? JSON.stringify(profile.contact) : null;
  const paragraphsArg = profile.paragraphs !== undefined ? JSON.stringify(profile.paragraphs) : null;
  await getDb().execute({
    sql: `insert into community_members
            (user_id, public_id, display_name, bio, country_code, projects_json,
             contact_json, paragraphs_json,
             qualified_track, qualified_topic, is_published, claimed_at, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict (user_id) do update set
            display_name = excluded.display_name,
            bio = excluded.bio,
            country_code = excluded.country_code,
            projects_json = excluded.projects_json,
            contact_json = coalesce(?, community_members.contact_json),
            paragraphs_json = coalesce(?, community_members.paragraphs_json),
            qualified_track = excluded.qualified_track,
            qualified_topic = excluded.qualified_topic,
            is_published = excluded.is_published,
            claimed_at = case
              when excluded.is_published = 1 then coalesce(community_members.claimed_at, excluded.claimed_at)
              else community_members.claimed_at
            end,
            updated_at = excluded.updated_at`,
    args: [
      userId,
      publicId,
      profile.displayName,
      profile.bio,
      profile.countryCode,
      JSON.stringify(profile.projects),
      contactArg !== null ? contactArg : "{}",
      paragraphsArg !== null ? paragraphsArg : "[]",
      qualifiedTrack.track,
      qualifiedTrack.topic,
      profile.publish ? 1 : 0,
      profile.publish ? now : null,
      now,
      now,
      contactArg,
      paragraphsArg
    ]
  });
  return getMember(userId);
}

module.exports = {
  MAX_BIO_LENGTH,
  MAX_PROJECTS,
  MAX_PARAGRAPHS,
  validateProfile,
  getQualifiedTracks,
  getMember,
  getPublicMember,
  getPublicMemberWithOwnership,
  listPublishedMembers,
  saveMember
};
