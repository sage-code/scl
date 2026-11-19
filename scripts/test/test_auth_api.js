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
  for (const file of ["001_init.sql", "002_community_profiles.sql", "003_email_canonical.sql"]) {
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
