"use strict";

const crypto = require("node:crypto");
const { getDb, nowIso } = require("./db");
const { HttpError } = require("./http");
const { qualifiedRoadmaps } = require("./quiz");

const MAX_BIO_LENGTH = 500;
const MAX_PROJECTS = 5;

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
    if (!name || name.length > 80 || href.length > 500) {
      throw new HttpError(400, "Each project needs a name of at most 80 characters and a valid HTTPS URL.");
    }
    let url;
    try {
      url = new URL(href);
    } catch (_error) {
      throw new HttpError(400, "Each project needs a valid HTTPS URL.");
    }
    if (url.protocol !== "https:" || !url.hostname || url.username || url.password) {
      throw new HttpError(400, "Project links must use HTTPS and cannot include credentials.");
    }
    return { name, url: url.toString() };
  });

  if (typeof body.publish !== "boolean") {
    throw new HttpError(400, "Choose whether to publish your community profile.");
  }

  return {
    displayName,
    bio,
    countryCode,
    projects,
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
                 qualified_track, qualified_topic, is_published, claimed_at, created_at, updated_at,
                 role, certification_label, certificate_url, member_since, is_legacy_verified
          from community_members where user_id = ?`,
    args: [userId]
  });
  return memberFromRow(result.rows[0]);
}

function memberFromRow(row) {
  if (!row) {
    return null;
  }
  let projects;
  try {
    projects = JSON.parse(row.projects_json || "[]");
  } catch (error) {
    throw new Error(`Stored community projects are invalid JSON: ${error.message}`);
  }
  if (!Array.isArray(projects)) {
    throw new Error("Stored community projects must be a JSON array.");
  }
  return {
    public_id: row.public_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    country_code: row.country_code,
    projects,
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

function publicMemberFromRow(row) {
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
    qualified_track: member.qualified_track,
    qualified_topic: member.qualified_topic,
    role: member.role,
    certification_label: member.certification_label,
    certificate_url: member.certificate_url,
    member_since: member.member_since,
    is_legacy_verified: member.is_legacy_verified,
    claimed_at: member.claimed_at
  };
}

async function getPublicMember(publicId) {
  const result = await getDb().execute({
    sql: `select c.user_id, u.email_verified_at, u.is_anonymous, c.public_id, c.display_name,
                 c.avatar_url, c.bio, c.country_code, c.projects_json, c.qualified_track,
                 c.qualified_topic, c.is_published, c.claimed_at, c.created_at, c.updated_at,
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
  if (Number(row.is_legacy_verified) === 1) {
    return publicMemberFromRow(row);
  }

  const qualified = (await getQualifiedTracks({
    id: row.user_id,
    is_anonymous: row.is_anonymous,
    email_verified_at: row.email_verified_at
  })).some((track) => track.track === row.qualified_track && track.topic === row.qualified_topic);
  return qualified ? publicMemberFromRow(row) : null;
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
  await getDb().execute({
    sql: `insert into community_members
            (user_id, public_id, display_name, bio, country_code, projects_json,
             qualified_track, qualified_topic, is_published, claimed_at, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict (user_id) do update set
            display_name = excluded.display_name,
            bio = excluded.bio,
            country_code = excluded.country_code,
            projects_json = excluded.projects_json,
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
      qualifiedTrack.track,
      qualifiedTrack.topic,
      profile.publish ? 1 : 0,
      profile.publish ? now : null,
      now,
      now
    ]
  });
  return getMember(userId);
}

module.exports = {
  MAX_BIO_LENGTH,
  MAX_PROJECTS,
  validateProfile,
  getQualifiedTracks,
  getMember,
  getPublicMember,
  listPublishedMembers,
  saveMember
};
