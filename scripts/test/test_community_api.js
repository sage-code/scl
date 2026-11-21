"use strict";

const assert = require("node:assert/strict");
const { Readable } = require("node:stream");
const { after, before, test } = require("node:test");

process.env.SCL_DATABASE_TURSO_DATABASE_URL = "file::memory:";
process.env.SCL_DATABASE_TURSO_AUTH_TOKEN = "";
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

const { getDb } = require("../../api/_lib/db");
const { hashToken } = require("../../api/_lib/session");
const { getQuiz } = require("../../api/_lib/quiz");
const submitQuiz = require("../../api/quizzes/submit");
const communityAvatar = require("../../api/community/avatar");
const communityProfile = require("../../api/community/profile");
const communityDirectory = require("../../api/community/directory");
const communityMember = require("../../api/community/member");
const communityTestimonial = require("../../api/community/testimonial");

const db = getDb();
const sessionToken = "community-api-test-session";
const userId = "community-api-test-user";

async function request(handler, method, body, url) {
  const response = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    getHeader(name) {
      return this.headers[name];
    },
    end(value) {
      this.body = value;
    }
  };
  await handler({
    method,
    url: url || "/api/test",
    headers: {
      cookie: `scl_sid=${sessionToken}`,
      host: "localhost",
      origin: "http://localhost",
      "content-type": "application/json"
    },
    body
  }, response);
  return { status: response.statusCode, body: JSON.parse(response.body || "{}") };
}

function correctAnswers(quiz) {
  return Object.fromEntries(quiz.questions.map((question) => [
    question.id,
    question.type === "matrix" ? question.correctByRow : question.correctOptionIds
  ]));
}

const profileInput = {
  qualified_track: "go",
  display_name: "Test Graduate",
  country_code: "us",
  bio: "A test profile.",
  projects: [{ name: "Example", url: "https://example.com/project" }],
  publish: true
};

before(async () => {
  await db.executeMultiple(`
    create table users (
      id text primary key,
      is_anonymous integer not null,
      email_verified_at text,
      last_seen_at text
    );
    create table sessions (
      token_hash text primary key,
      user_id text not null,
      created_at text not null,
      expires_at text not null
    );
    create table quiz_attempts (
      id text primary key,
      user_id text not null,
      quiz_id text not null,
      track text not null,
      topic text not null,
      level text not null,
      revision integer not null,
      points_earned integer not null,
      points_possible integer not null,
      score_percent real not null,
      status text not null,
      completed_at text not null
    );
    create table community_members (
      user_id text primary key,
      public_id text not null unique,
      display_name text not null,
      avatar_url text,
      avatar_path text,
      bio text not null,
      country_code text,
      projects_json text not null,
      contact_json text not null default '{}',
      paragraphs_json text not null default '[]',
      qualified_track text not null,
      qualified_topic text not null,
      role text not null default 'VCP Graduate',
      certification_label text,
      certificate_url text,
      member_since integer,
      is_legacy_verified integer not null default 0,
      is_published integer not null,
      claimed_at text,
      created_at text not null,
      updated_at text not null
    );
    create table community_testimonials (
      id text primary key,
      target_user_id text not null,
      author_user_id text not null,
      author_name text not null,
      author_role text not null,
      content text not null,
      created_at text not null,
      updated_at text not null
    );
  `);

  const now = new Date().toISOString();
  await db.execute({
    sql: "insert into users (id, is_anonymous, email_verified_at, last_seen_at) values (?, 0, ?, ?)",
    args: [userId, now, now]
  });
  await db.execute({
    sql: "insert into sessions (token_hash, user_id, created_at, expires_at) values (?, ?, ?, ?)",
    args: [hashToken(sessionToken), userId, now, new Date(Date.now() + 60_000).toISOString()]
  });
});

after(async () => {
  await db.close();
});

test("server quiz attempts gate community profile claims by current A/B/C passes", async () => {
  const emptyDirectory = await request(communityDirectory, "GET");
  assert.equal(emptyDirectory.status, 200);
  assert.deepEqual(emptyDirectory.body.members, []);

  const beforePassing = await request(communityProfile, "GET");
  assert.equal(beforePassing.status, 200);
  assert.equal(beforePassing.body.eligible, false);
  assert.deepEqual(beforePassing.body.qualified_tracks, []);

  const deniedClaim = await request(communityProfile, "POST", profileInput);
  assert.equal(deniedClaim.status, 403);

  const failedAttempt = await request(submitQuiz, "POST", {
    quiz_id: "go-syntax-A",
    answers: {},
    points_earned: 61,
    score_percent: 100
  });
  assert.equal(failedAttempt.status, 201);
  assert.equal(failedAttempt.body.scored.scorePercent, 0);

  for (const quizId of ["go-syntax-A", "go-syntax-B", "go-syntax-C"]) {
    const quiz = getQuiz(quizId);
    const attempt = await request(submitQuiz, "POST", {
      quiz_id: quizId,
      answers: correctAnswers(quiz)
    });
    assert.equal(attempt.status, 201);
    assert.equal(attempt.body.scored.scorePercent, 100);
    assert.equal(attempt.body.scored.questions.length, quiz.questions.length);
  }

  const eligible = await request(communityProfile, "GET");
  assert.equal(eligible.status, 200);
  assert.equal(eligible.body.eligible, true);
  assert.deepEqual(eligible.body.qualified_tracks, [{ track: "go", topic: "syntax" }]);

  const saved = await request(communityProfile, "POST", profileInput);
  assert.equal(saved.status, 200);
  assert.equal(saved.body.profile.published, true);
  assert.equal(saved.body.profile.country_code, "US");
  assert.equal(saved.body.profile.projects[0].url, "https://example.com/project");

  const listed = await request(communityDirectory, "GET");
  assert.equal(listed.status, 200);
  assert.equal(listed.body.members.length, 1);
  assert.equal(listed.body.members[0].public_id, saved.body.profile.public_id);
  assert.equal(Object.prototype.hasOwnProperty.call(listed.body.members[0], "user_id"), false);

  const publicProfile = await request(
    communityMember,
    "GET",
    undefined,
    "/api/community/member?public_id=" + encodeURIComponent(saved.body.profile.public_id)
  );
  assert.equal(publicProfile.status, 200);
  assert.equal(publicProfile.body.profile.display_name, "Test Graduate");
  assert.equal(publicProfile.body.profile.projects[0].url, "https://example.com/project");
  assert.equal(Object.prototype.hasOwnProperty.call(publicProfile.body.profile, "user_id"), false);
  assert.equal(Object.prototype.hasOwnProperty.call(publicProfile.body.profile, "email"), false);

  const unpublished = await request(communityProfile, "POST", {
    ...profileInput,
    publish: false
  });
  assert.equal(unpublished.status, 200);
  assert.equal(unpublished.body.profile.published, false);
  assert.deepEqual((await request(communityDirectory, "GET")).body.members, []);
  const hiddenProfile = await request(
    communityMember,
    "GET",
    undefined,
    "/api/community/member?public_id=" + encodeURIComponent(saved.body.profile.public_id)
  );
  assert.equal(hiddenProfile.status, 404);

  const invalidProject = await request(communityProfile, "POST", {
    ...profileInput,
    projects: [{ name: "Unsafe URL", url: "https://user:pass@example.com/" }]
  });
  assert.equal(invalidProject.status, 400);

  // public_id remains stable across profile updates.
  assert.equal(unpublished.body.profile.public_id, saved.body.profile.public_id);
});

async function rawRequest(handler, method, { headers = {}, rawBytes } = {}) {
  const response = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name] = value;
    },
    getHeader(name) {
      return this.headers[name];
    },
    end(value) {
      this.body = value;
    }
  };
  const stream = Readable.from(rawBytes ? [rawBytes] : []);
  stream.method = method;
  stream.url = "/api/community/avatar";
  stream.headers = {
    cookie: `scl_sid=${sessionToken}`,
    host: "localhost",
    origin: "http://localhost",
    ...headers
  };
  await handler(stream, response);
  return { status: response.statusCode, body: JSON.parse(response.body || "{}") };
}

test("community profile validation and avatar security checks", async () => {
  // Unauthenticated request is rejected.
  const unauthRes = await rawRequest(communityProfile, "GET", { headers: { cookie: "" } });
  assert.equal(unauthRes.status, 401);

  // Validation checks on profile fields.
  for (const invalid of [
    { ...profileInput, country_code: "USA" },
    { ...profileInput, bio: "x".repeat(501) },
    { ...profileInput, projects: Array.from({ length: 6 }, (_, i) => ({ name: `P${i}`, url: "https://example.com" })) },
    { ...profileInput, projects: [{ name: "HTTP", url: "http://example.com" }] },
    { ...profileInput, publish: "yes" }
  ]) {
    const res = await request(communityProfile, "POST", invalid);
    assert.equal(res.status, 400);
  }

  // Avatar rejects SVG and magic-byte mismatches.
  const svgRes = await rawRequest(communityAvatar, "POST", {
    headers: { "content-type": "image/svg+xml" },
    rawBytes: Buffer.from("<svg></svg>")
  });
  assert.equal(svgRes.status, 415);

  const spoofedPng = await rawRequest(communityAvatar, "POST", {
    headers: { "content-type": "image/png" },
    rawBytes: Buffer.from("<svg>not a png</svg>")
  });
  assert.equal(spoofedPng.status, 415);

  // Avatar DELETE clears stored avatar_url and avatar_path.
  await db.execute({
    sql: "update community_members set avatar_url = ?, avatar_path = ? where user_id = ?",
    args: ["https://example.com/avatar.png", "community/store/avatar.png", userId]
  });
  const delRes = await rawRequest(communityAvatar, "DELETE");
  assert.equal(delRes.status, 200);
  assert.equal(delRes.body.avatar_url, null);

  const afterDel = await request(communityProfile, "GET");
  assert.equal(afterDel.body.profile.avatar_url, null);
});

test("user_id lookup, owner-only editing, contact/paragraphs, and automatic certificates", async () => {
  const otherUserId = "community-api-other-user";
  const otherToken = "community-api-other-session";
  const now = new Date().toISOString();
  await db.execute({
    sql: "insert into users (id, is_anonymous, email_verified_at, last_seen_at) values (?, 0, ?, ?)",
    args: [otherUserId, now, now]
  });
  await db.execute({
    sql: "insert into sessions (token_hash, user_id, created_at, expires_at) values (?, ?, ?, ?)",
    args: [hashToken(otherToken), otherUserId, now, new Date(Date.now() + 60_000).toISOString()]
  });

  // Pass a second track (css) to verify automatic multi-certificate listing.
  for (const quizId of ["css-foundations-A", "css-foundations-B", "css-foundations-C"]) {
    const quiz = getQuiz(quizId);
    const attempt = await request(submitQuiz, "POST", {
      quiz_id: quizId,
      answers: correctAnswers(quiz)
    });
    assert.equal(attempt.status, 201);
  }

  const updated = await request(communityProfile, "POST", {
    ...profileInput,
    role: "Software Engineer",
    education: "B.S. in Computer Science",
    projects: [{ name: "Example", url: "https://example.com/project", description: "Demo project" }],
    contact: {
      website: "https://example.com",
      github: "https://github.com/testuser",
      discord: "@testuser",
      email: "test@example.com"
    },
    paragraphs: [{ heading: "Experience", body: "Built open-source tools." }],
    publish: true
  });
  assert.equal(updated.status, 200);
  const publicId = updated.body.profile.public_id;

  // Owner lookup via user_id query parameter returns is_owner: true and automatic certificates.
  const ownerView = await request(
    communityMember,
    "GET",
    undefined,
    "/api/community/member?user_id=" + encodeURIComponent(publicId)
  );
  assert.equal(ownerView.status, 200);
  assert.equal(ownerView.body.is_owner, true);
  assert.equal(ownerView.body.profile.role, "Software Engineer");
  assert.equal(ownerView.body.profile.education, "B.S. in Computer Science");
  assert.equal(ownerView.body.profile.vcp_verified, true);
  assert.equal(ownerView.body.profile.contact.github, "https://github.com/testuser");
  assert.equal(ownerView.body.profile.paragraphs[0].heading, "Experience");
  assert.equal(ownerView.body.profile.projects[0].description, "Demo project");
  assert.deepEqual(
    ownerView.body.profile.certificates.map((c) => c.track),
    ["css", "go"]
  );

  // Anonymous visitor gets is_owner: false.
  const anonRes = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    getHeader(name) { return this.headers[name]; },
    end(value) { this.body = value; }
  };
  await communityMember({
    method: "GET",
    url: "/api/community/member?user_id=" + encodeURIComponent(publicId),
    headers: { host: "localhost", origin: "http://localhost" }
  }, anonRes);
  assert.equal(anonRes.statusCode, 200);
  assert.equal(JSON.parse(anonRes.body).is_owner, false);

  // Another signed-in user gets is_owner: false and cannot edit the owner's profile.
  const otherRes = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    getHeader(name) { return this.headers[name]; },
    end(value) { this.body = value; }
  };
  await communityMember({
    method: "GET",
    url: "/api/community/member?user_id=" + encodeURIComponent(publicId),
    headers: { cookie: `scl_sid=${otherToken}`, host: "localhost", origin: "http://localhost" }
  }, otherRes);
  assert.equal(otherRes.statusCode, 200);
  assert.equal(JSON.parse(otherRes.body).is_owner, false);

  // Another user posting to /api/community/profile cannot overwrite owner's profile.
  const hijacked = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    getHeader(name) { return this.headers[name]; },
    end(value) { this.body = value; }
  };
  await communityProfile({
    method: "POST",
    url: "/api/community/profile",
    headers: {
      cookie: `scl_sid=${otherToken}`,
      host: "localhost",
      origin: "http://localhost",
      "content-type": "application/json"
    },
    body: { ...profileInput, display_name: "Hijacker" }
  }, hijacked);
  assert.equal(hijacked.statusCode, 403);

  // Invalid contact URL is rejected.
  const badContact = await request(communityProfile, "POST", {
    ...profileInput,
    contact: { website: "http://insecure.example.com" }
  });
  assert.equal(badContact.status, 400);

  // Education rows, certification_label, and Mentor testimonials.
  const withEdu = await request(communityProfile, "POST", {
    ...profileInput,
    role: "Mentor",
    certification_label: "Web Developer",
    education_rows: [
      { institution: "MIT / US", year_started: "2018", year_ended: "2022" }
    ],
    publish: true
  });
  assert.equal(withEdu.status, 200);
  assert.equal(withEdu.body.profile.certification_label, "Web Developer");
  assert.equal(withEdu.body.profile.education_rows.length, 1);
  assert.equal(withEdu.body.profile.education_rows[0].institution, "MIT / US");

  // Non-mentor cannot add a testimonial.
  const nonMentorTestimonial = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) { this.headers[name] = value; },
    getHeader(name) { return this.headers[name]; },
    end(value) { this.body = value; }
  };
  await communityTestimonial({
    method: "POST",
    url: "/api/community/testimonial",
    headers: {
      cookie: `scl_sid=${otherToken}`,
      host: "localhost",
      origin: "http://localhost",
      "content-type": "application/json"
    },
    body: { user_id: publicId, content: "Great developer!" }
  }, nonMentorTestimonial);
  assert.equal(nonMentorTestimonial.statusCode, 403);

  // Mentor can add a testimonial and it appears on the profile.
  const mentorTestimonial = await request(communityTestimonial, "POST", {
    user_id: publicId,
    content: "Excellent engineering skills."
  });
  assert.equal(mentorTestimonial.status, 201);
  assert.equal(mentorTestimonial.body.testimonial.author_role, "Mentor");

  const withTestimonials = await request(
    communityMember,
    "GET",
    undefined,
    "/api/community/member?user_id=" + encodeURIComponent(publicId)
  );
  assert.equal(withTestimonials.status, 200);
  assert.equal(withTestimonials.body.can_add_testimonial, true);
  assert.equal(withTestimonials.body.profile.testimonials.length, 1);
  assert.equal(withTestimonials.body.profile.testimonials[0].content, "Excellent engineering skills.");
});
