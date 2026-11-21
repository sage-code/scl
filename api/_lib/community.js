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
const VALID_ROLES = ["Student", "Developer", "Mentor", "Instructor"];

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
    const repoHref = typeof project.repo_url === "string" ? project.repo_url.trim() : "";
    const description = typeof project.description === "string" ? project.description.trim() : "";
    if (!name || name.length > 80 || href.length > 500) {
      throw new HttpError(400, "Each project needs a name of at most 80 characters and a valid HTTPS URL.");
    }
    if (description.length > MAX_PROJECT_DESC) {
      throw new HttpError(400, `Project description must be ${MAX_PROJECT_DESC} characters or fewer.`);
    }
    const url = validateHttpsUrl(href, "Project homepage link");
    const out = { name, url };
    if (repoHref) {
      out.repo_url = validateHttpsUrl(repoHref, "Project repository link");
    }
    if (description) {
      out.description = description;
    }
    return out;
  });

  if (typeof body.publish !== "boolean") {
    throw new HttpError(400, "Choose whether to publish your community profile.");
  }

  let role;
  if (body.role !== undefined) {
    role = typeof body.role === "string" ? body.role.trim() : "";
    if (role && VALID_ROLES.indexOf(role) === -1) {
      throw new HttpError(400, "Role must be Student, Developer, Mentor, or Instructor.");
    }
    role = role || undefined;
  }

  let certificationLabel;
  if (body.certification_label !== undefined) {
    certificationLabel = typeof body.certification_label === "string" ? body.certification_label.trim() : "";
    if (certificationLabel.length > 80) {
      throw new HttpError(400, "Position / qualification must be 80 characters or fewer.");
    }
    certificationLabel = certificationLabel || null;
  }

  let education;
  if (body.education !== undefined) {
    education = typeof body.education === "string" ? body.education.trim() : "";
    if (education.length > MAX_PARAGRAPH_BODY) {
      throw new HttpError(400, `Education paragraph must be ${MAX_PARAGRAPH_BODY} characters or fewer.`);
    }
  }

  let educationRows;
  if (body.education_rows !== undefined) {
    if (!Array.isArray(body.education_rows) || body.education_rows.length > 10) {
      throw new HttpError(400, "Provide no more than 10 education entries.");
    }
    educationRows = body.education_rows.map((item) => {
      if (!item || typeof item !== "object") {
        throw new HttpError(400, "Each education entry must be an object.");
      }
      const institution = typeof item.institution === "string" ? item.institution.trim() : "";
      const country = typeof item.country === "string" ? item.country.trim() : "";
      const yearStarted = item.year_started != null ? String(item.year_started).trim() : "";
      const yearEnded = item.year_ended != null ? String(item.year_ended).trim() : "";
      if (!institution || institution.length > 120) {
        throw new HttpError(400, "Institution is required and must be 120 characters or fewer.");
      }
      if (country.length > 80) {
        throw new HttpError(400, "Country must be 80 characters or fewer.");
      }
      if (yearStarted.length > 20 || yearEnded.length > 20) {
        throw new HttpError(400, "Education years must be 20 characters or fewer.");
      }
      return {
        kind: "education_row",
        institution,
        country,
        year_started: yearStarted,
        year_ended: yearEnded
      };
    });
  }

  let paragraphs = validateParagraphs(body.paragraphs);
  if (education !== undefined || educationRows !== undefined) {
    const base = paragraphs || [];
    const others = base.filter((p) => p.heading !== "Education" && p.kind !== "education_row");
    const eduItems = [];
    if (education) {
      eduItems.push({ heading: "Education", body: education });
    }
    if (educationRows) {
      eduItems.push(...educationRows);
    }
    paragraphs = [...eduItems, ...others];
  }

  return {
    displayName,
    role,
    certificationLabel,
    bio,
    countryCode,
    projects,
    contact: validateContact(body.contact),
    paragraphs,
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

function extractEducationAndParagraphs(rawParagraphs) {
  const list = parseJsonArray(rawParagraphs, "community paragraphs");
  let education = "";
  const educationRows = [];
  const paragraphs = [];
  for (const item of list) {
    if (!item) continue;
    if (item.kind === "education_row" && item.institution) {
      educationRows.push({
        institution: item.institution,
        country: item.country || "",
        year_started: item.year_started || "",
        year_ended: item.year_ended || ""
      });
    } else if (item.heading === "Education" && !education) {
      education = item.body || "";
    } else if (item.body) {
      paragraphs.push(item);
    }
  }
  return { education, educationRows, paragraphs };
}

function memberFromRow(row) {
  if (!row) {
    return null;
  }
  const projects = parseJsonArray(row.projects_json, "community projects");
  const contact = parseJsonObject(row.contact_json, "community contact");
  const { education, educationRows, paragraphs } = extractEducationAndParagraphs(row.paragraphs_json);
  return {
    public_id: row.public_id,
    display_name: row.display_name,
    avatar_url: row.avatar_url,
    bio: row.bio,
    education,
    education_rows: educationRows,
    country_code: row.country_code,
    projects,
    contact,
    paragraphs,
    qualified_track: row.qualified_track,
    qualified_topic: row.qualified_topic,
    role: row.role || "Student",
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

function publicMemberFromRow(row, qualifiedTracks, testimonials) {
  const member = memberFromRow(row);
  if (!member) {
    return null;
  }
  const certificates = buildCertificates(row, qualifiedTracks);
  return {
    public_id: member.public_id,
    display_name: member.display_name,
    avatar_url: member.avatar_url,
    bio: member.bio,
    education: member.education,
    education_rows: member.education_rows,
    country_code: member.country_code,
    projects: member.projects,
    contact: member.contact,
    paragraphs: member.paragraphs,
    qualified_track: member.qualified_track,
    qualified_topic: member.qualified_topic,
    role: member.role,
    certification_label: member.certification_label,
    certificate_url: member.certificate_url,
    certificates,
    testimonials: testimonials || [],
    member_since: member.member_since,
    is_legacy_verified: member.is_legacy_verified,
    claimed_at: member.claimed_at
  };
}

async function listTestimonials(targetUserId, viewerUserId) {
  try {
    const result = await getDb().execute({
      sql: `select id, author_user_id, author_name, author_role, content, created_at
            from community_testimonials
            where target_user_id = ?
            order by created_at desc`,
      args: [targetUserId]
    });
    return result.rows.map((row) => ({
      id: row.id,
      author_name: row.author_name,
      author_role: row.author_role,
      content: row.content,
      created_at: row.created_at,
      can_delete: Boolean(viewerUserId && (viewerUserId === row.author_user_id || viewerUserId === targetUserId))
    }));
  } catch (_error) {
    return [];
  }
}

async function getViewerRoleInfo(userId) {
  if (!userId) {
    return { isAdmin: false, role: null, isLegacyVerified: false };
  }
  let isAdmin = false;
  try {
    const userRes = await getDb().execute({
      sql: "select is_admin from users where id = ? limit 1",
      args: [userId]
    });
    isAdmin = Boolean(userRes.rows[0] && Number(userRes.rows[0].is_admin) === 1);
  } catch (_error) {
    // Older test schemas may omit users.is_admin.
  }
  const memberRes = await getDb().execute({
    sql: "select role, is_legacy_verified from community_members where user_id = ? limit 1",
    args: [userId]
  });
  const row = memberRes.rows[0];
  return {
    isAdmin,
    role: row ? (row.role || "Student") : null,
    isLegacyVerified: Boolean(row && Number(row.is_legacy_verified) === 1)
  };
}

function getAllowedRolesForEdit(viewerInfo, isOwner, targetRole) {
  if (viewerInfo.isAdmin || viewerInfo.role === "Instructor") {
    return VALID_ROLES.slice();
  }
  if (!isOwner && viewerInfo.role === "Mentor" && targetRole === "Student") {
    return ["Student", "Developer"];
  }
  return [];
}

function canEditProfile(viewerInfo, isOwner, targetRole) {
  if (isOwner) return true;
  if (viewerInfo.isAdmin || viewerInfo.role === "Instructor") return true;
  if (viewerInfo.role === "Mentor" && targetRole === "Student") return true;
  return false;
}

async function isMentorUser(userId) {
  const info = await getViewerRoleInfo(userId);
  if (info.isAdmin || info.isLegacyVerified) return true;
  const r = String(info.role || "").trim().toLowerCase();
  return r === "mentor" || r === "instructor";
}

async function getMemberByPublicId(publicId) {
  const result = await getDb().execute({
    sql: `select user_id, public_id, display_name, avatar_url, bio, country_code, projects_json,
                 contact_json, paragraphs_json, qualified_track, qualified_topic, is_published,
                 claimed_at, created_at, updated_at, role, certification_label, certificate_url,
                 member_since, is_legacy_verified
          from community_members where public_id = ? limit 1`,
    args: [publicId]
  });
  const row = result.rows[0];
  if (!row) return null;
  return { user_id: row.user_id, member: memberFromRow(row) };
}

async function addTestimonial(authorUserId, targetPublicId, rawContent) {
  const isMentor = await isMentorUser(authorUserId);
  if (!isMentor) {
    throw new HttpError(403, "Only verified mentors can add testimonials.");
  }
  const content = typeof rawContent === "string" ? rawContent.trim() : "";
  if (!content || content.length > 1000) {
    throw new HttpError(400, "Testimonial must be 1 to 1000 characters.");
  }
  const targetRes = await getDb().execute({
    sql: "select user_id from community_members where public_id = ? and is_published = 1 limit 1",
    args: [targetPublicId]
  });
  const target = targetRes.rows[0];
  if (!target) {
    throw new HttpError(404, "Target community profile not found.");
  }
  const authorRes = await getDb().execute({
    sql: "select display_name, role from community_members where user_id = ? limit 1",
    args: [authorUserId]
  });
  const author = authorRes.rows[0] || {};
  const id = crypto.randomUUID();
  const now = nowIso();
  const authorName = author.display_name || "Mentor";
  const authorRole = author.role || "Mentor";
  await getDb().execute({
    sql: `insert into community_testimonials
            (id, target_user_id, author_user_id, author_name, author_role, content, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [id, target.user_id, authorUserId, authorName, authorRole, content, now, now]
  });
  return {
    id,
    author_name: authorName,
    author_role: authorRole,
    content,
    created_at: now,
    can_delete: true
  };
}

async function deleteTestimonial(viewerUserId, testimonialId) {
  const existing = await getDb().execute({
    sql: "select id, target_user_id, author_user_id from community_testimonials where id = ? limit 1",
    args: [testimonialId]
  });
  const row = existing.rows[0];
  if (!row) {
    throw new HttpError(404, "Testimonial not found.");
  }
  if (row.author_user_id !== viewerUserId && row.target_user_id !== viewerUserId) {
    throw new HttpError(403, "You can only remove your own testimonials.");
  }
  await getDb().execute({
    sql: "delete from community_testimonials where id = ?",
    args: [testimonialId]
  });
}

async function getPublicMemberWithOwnership(publicId, viewerUserId) {
  const result = await getDb().execute({
    sql: `select c.user_id, u.email_verified_at, u.is_anonymous, c.public_id, c.display_name,
                 c.avatar_url, c.bio, c.country_code, c.projects_json, c.contact_json, c.paragraphs_json,
                 c.qualified_track, c.qualified_topic, c.is_published, c.claimed_at, c.created_at, c.updated_at,
                 c.role, c.certification_label, c.certificate_url, c.member_since, c.is_legacy_verified
          from community_members c
          join users u on u.id = c.user_id
          where c.public_id = ?
            and u.is_anonymous = 0
            and (c.is_legacy_verified = 1 or u.email_verified_at is not null)`,
    args: [publicId]
  });
  const row = result.rows[0];
  if (!row) {
    return null;
  }
  const isOwner = Boolean(viewerUserId && row.user_id === viewerUserId);
  const viewerInfo = await getViewerRoleInfo(viewerUserId);
  const targetRole = row.role || "Student";
  const canEdit = canEditProfile(viewerInfo, isOwner, targetRole);
  const allowedRoles = getAllowedRolesForEdit(viewerInfo, isOwner, targetRole);
  const canAddTestimonial = await isMentorUser(viewerUserId);
  const isPublished = Number(row.is_published) === 1;
  const isPreQuizOwnerDraft = !isPublished && !row.claimed_at && isOwner;
  if (!isPublished && !isPreQuizOwnerDraft) {
    return null;
  }
  const qualifiedTracks = await getQualifiedTracks({
    id: row.user_id,
    is_anonymous: row.is_anonymous,
    email_verified_at: row.email_verified_at
  });
  const testimonials = await listTestimonials(row.user_id, viewerUserId);
  if (Number(row.is_legacy_verified) === 1 || isOwner || canEdit) {
    return {
      profile: publicMemberFromRow(row, qualifiedTracks, testimonials),
      is_owner: isOwner,
      can_edit: canEdit,
      allowed_roles: allowedRoles,
      can_add_testimonial: canAddTestimonial
    };
  }

  const attemptsRes = await getDb().execute({
    sql: "select 1 as ok from quiz_attempts where user_id = ? limit 1",
    args: [row.user_id]
  });
  const hasQuiz = attemptsRes.rows.length > 0;
  return isPublished && hasQuiz
    ? {
        profile: publicMemberFromRow(row, qualifiedTracks, testimonials),
        is_owner: isOwner,
        can_edit: canEdit,
        allowed_roles: allowedRoles,
        can_add_testimonial: canAddTestimonial
      }
    : null;
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
    .filter(({ row, attempts }) => Number(row.is_legacy_verified) === 1 || attempts.length > 0)
    .map(({ row }) => ({
      public_id: row.public_id,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      country_code: row.country_code,
      qualified_track: row.qualified_track,
      qualified_topic: row.qualified_topic,
      role: row.role || "Student",
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
  const roleArg = profile.role !== undefined ? profile.role : null;
  const certLabelArg = profile.certificationLabel !== undefined ? profile.certificationLabel : null;
  await getDb().execute({
    sql: `insert into community_members
            (user_id, public_id, display_name, bio, country_code, projects_json,
             contact_json, paragraphs_json, role, certification_label,
             qualified_track, qualified_topic, is_published, claimed_at, created_at, updated_at)
          values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          on conflict (user_id) do update set
            display_name = excluded.display_name,
            bio = excluded.bio,
            country_code = excluded.country_code,
            projects_json = excluded.projects_json,
            contact_json = coalesce(?, community_members.contact_json),
            paragraphs_json = coalesce(?, community_members.paragraphs_json),
            role = coalesce(?, community_members.role),
            certification_label = coalesce(?, community_members.certification_label),
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
      roleArg !== null ? roleArg : "Student",
      certLabelArg,
      qualifiedTrack.track,
      qualifiedTrack.topic,
      profile.publish ? 1 : 0,
      profile.publish ? now : null,
      now,
      now,
      contactArg,
      paragraphsArg,
      roleArg,
      certLabelArg
    ]
  });
  return getMember(userId);
}

module.exports = {
  MAX_BIO_LENGTH,
  MAX_PROJECTS,
  MAX_PARAGRAPHS,
  VALID_ROLES,
  validateProfile,
  getQualifiedTracks,
  getMember,
  getMemberByPublicId,
  getViewerRoleInfo,
  getAllowedRolesForEdit,
  canEditProfile,
  getPublicMember,
  getPublicMemberWithOwnership,
  listPublishedMembers,
  saveMember,
  addTestimonial,
  deleteTestimonial
};
