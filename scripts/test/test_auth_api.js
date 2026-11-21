"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { after, before, test } = require("node:test");

process.env.SCL_DATABASE_TURSO_DATABASE_URL = "file::memory:";
process.env.SCL_DATABASE_TURSO_AUTH_TOKEN = "";
delete process.env.TURSO_DATABASE_URL;
delete process.env.TURSO_AUTH_TOKEN;

const { getDb } = require("../../api/_lib/db");
const authHandler = require("../../api/auth/[action]");

const db = getDb();

function loadSql(file) {
  return fs
    .readFileSync(path.join(__dirname, "..", "..", "database", "turso", file), "utf8")
    .replace(/--[^\n]*/g, "")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
}

async function callAuth(action, method, body, headers = {}) {
  const response = {
    headers: {},
    statusCode: 200,
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    getHeader(name) {
      return this.headers[name.toLowerCase()];
    },
    end(value) {
      this.body = value;
    }
  };
  await authHandler(
    {
      method,
      url: `/api/auth/${action}/?action=${action}`,
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "content-type": "application/json",
        ...headers
      },
      body
    },
    response
  );
  return { status: response.statusCode, body: JSON.parse(response.body || "{}") };
}

before(async () => {
  for (const file of ["001_init.sql", "002_community_profiles.sql", "003_email_canonical.sql", "004_user_avatar_and_legacy_members.sql"]) {
    for (const sql of loadSql(file)) {
      await db.execute(sql);
    }
  }
});

after(async () => {
  await db.close();
});

test("register allows only one username per email including Gmail dot/plus aliases", async () => {
  const first = await callAuth("register", "POST", {
    handle: "alice_one",
    email: "Alice.User@gmail.com",
    password: "StrongPassword!99",
    website: ""
  });
  assert.equal(first.status, 201);
  assert.equal(first.body.user.handle, "alice_one");

  const exactDup = await callAuth("register", "POST", {
    handle: "alice_two",
    email: "alice.user@gmail.com",
    password: "StrongPassword!99",
    website: ""
  });
  assert.equal(exactDup.status, 409);

  const plusDup = await callAuth("register", "POST", {
    handle: "alice_three",
    email: "aliceuser+alt@gmail.com",
    password: "StrongPassword!99",
    website: ""
  });
  assert.equal(plusDup.status, 409);

  const googlemailDup = await callAuth("register", "POST", {
    handle: "alice_four",
    email: "a.liceuser@googlemail.com",
    password: "StrongPassword!99",
    website: ""
  });
  assert.equal(googlemailDup.status, 409);
});

test("register blocks +tag aliases on non-Gmail domains while preserving significant dots", async () => {
  const ipHeader = { "x-forwarded-for": "203.0.113.2" };
  const bob = await callAuth("register", "POST", {
    handle: "bob_one",
    email: "bob.smith+1@example.com",
    password: "StrongPassword!99",
    website: ""
  }, ipHeader);
  assert.equal(bob.status, 201);

  const bobPlusDup = await callAuth("register", "POST", {
    handle: "bob_two",
    email: "bob.smith+2@example.com",
    password: "StrongPassword!99",
    website: ""
  }, ipHeader);
  assert.equal(bobPlusDup.status, 409);

  const bobNoDot = await callAuth("register", "POST", {
    handle: "bob_three",
    email: "bobsmith@example.com",
    password: "StrongPassword!99",
    website: ""
  }, ipHeader);
  assert.equal(bobNoDot.status, 201);
});

test("forgot resolves Gmail canonical aliases, sends reset link, and reset updates password", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.RESEND_SEND_KEY;
  const sentEmails = [];

  process.env.RESEND_SEND_KEY = "re_test_key";
  global.fetch = async (_url, options) => {
    sentEmails.push(JSON.parse(options.body));
    return {
      ok: true,
      status: 200,
      headers: new Map(),
      async json() {
        return { id: "email_test_123" };
      }
    };
  };

  try {
    // Request reset using a canonical alias of Alice.User@gmail.com
    const forgotRes = await callAuth("forgot", "POST", { email: "aliceuser@gmail.com" });
    assert.equal(forgotRes.status, 200);
    assert.equal(sentEmails.length, 1);
    assert.deepEqual(sentEmails[0].to, ["alice.user@gmail.com"]);

    const match = sentEmails[0].text.match(/token=([A-Za-z0-9._~%-]+)/);
    assert.ok(match, "reset email should include a token query parameter");
    const token = decodeURIComponent(match[1]);

    const resetRes = await callAuth("reset", "POST", {
      token,
      password: "NewStrongPassword!42"
    });
    assert.equal(resetRes.status, 200);

    // Reusing the same token must fail
    const reuseRes = await callAuth("reset", "POST", {
      token,
      password: "AnotherStrongPassword!42"
    });
    assert.equal(reuseRes.status, 400);

    // Signing in with the new password succeeds
    const loginRes = await callAuth("login", "POST", {
      email: "aliceuser@gmail.com",
      password: "NewStrongPassword!42"
    });
    assert.equal(loginRes.status, 200);
    assert.equal(loginRes.body.user.handle, "alice_one");
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) {
      delete process.env.RESEND_SEND_KEY;
    } else {
      process.env.RESEND_SEND_KEY = originalKey;
    }
  }
});

test("forgot surfaces mail delivery errors instead of silently succeeding", async () => {
  const originalKey = process.env.RESEND_SEND_KEY;
  const originalApiKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_SEND_KEY;
  delete process.env.RESEND_API_KEY;

  try {
    const res = await callAuth("forgot", "POST", { email: "alice.user@gmail.com" });
    assert.equal(res.status, 502);
    assert.match(res.body.error, /not configured/i);
  } finally {
    if (originalKey !== undefined) process.env.RESEND_SEND_KEY = originalKey;
    if (originalApiKey !== undefined) process.env.RESEND_API_KEY = originalApiKey;
  }
});

test("anonymous users get an invented handle and can change username without email", async () => {
  const anonRes = await authHandler(
    {
      method: "POST",
      url: "/api/auth/anonymous/?action=anonymous",
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.55"
      },
      body: {}
    },
    (() => {
      const r = {
        headers: {},
        statusCode: 200,
        setHeader(n, v) { this.headers[n.toLowerCase()] = v; },
        getHeader(n) { return this.headers[n.toLowerCase()]; },
        end(v) { this.body = v; }
      };
      return r;
    })()
  );
  // Use a direct response capture to grab cookie
  let capturedCookie = "";
  const capRes = {
    headers: {},
    statusCode: 200,
    setHeader(n, v) {
      this.headers[n.toLowerCase()] = v;
      if (n.toLowerCase() === "set-cookie") {
        capturedCookie = String(Array.isArray(v) ? v[0] : v).split(";")[0];
      }
    },
    getHeader(n) { return this.headers[n.toLowerCase()]; },
    end(v) { this.body = v; }
  };
  await authHandler(
    {
      method: "POST",
      url: "/api/auth/anonymous/?action=anonymous",
      headers: {
        host: "localhost",
        origin: "http://localhost",
        "content-type": "application/json",
        "x-forwarded-for": "203.0.113.56"
      },
      body: {}
    },
    capRes
  );
  assert.equal(capRes.statusCode, 201);
  const createdUser = JSON.parse(capRes.body).user;
  assert.match(createdUser.handle, /^\d{5}$/);
  assert.equal(createdUser.avatar_url, null);

  // Anonymous user can update their username without an email
  const updateRes = await callAuth("profile", "POST", { handle: "GuestCoder_77" }, { cookie: capturedCookie });
  assert.equal(updateRes.status, 200);
  assert.equal(updateRes.body.user.handle, "GuestCoder_77");

  // Anonymous user cannot set a password without registering an email
  const pwRes = await callAuth("profile", "POST", { password: "NewPassword!99" }, { cookie: capturedCookie });
  assert.equal(pwRes.status, 403);
});
