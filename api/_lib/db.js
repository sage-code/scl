"use strict";

// Shared Turso (libSQL) client. Env names follow the Vercel Turso integration
// (SCL_DATABASE_ prefix) with plain TURSO_* as a fallback.

let client = null;

function databaseConfig() {
  return {
    url: process.env.SCL_DATABASE_TURSO_DATABASE_URL || process.env.TURSO_DATABASE_URL || "",
    authToken: process.env.SCL_DATABASE_TURSO_AUTH_TOKEN || process.env.TURSO_AUTH_TOKEN || undefined
  };
}

function getDb() {
  if (client) {
    return client;
  }

  const config = databaseConfig();
  if (!config.url) {
    throw new Error("Turso is not configured: set SCL_DATABASE_TURSO_DATABASE_URL.");
  }

  // The web client is pure fetch/WebSocket (no native binary) and is what runs on
  // Vercel. Local file: databases (tests) need the full Node client.
  const lib = config.url.startsWith("file:") ? require("@libsql/client") : require("@libsql/client/web");
  client = lib.createClient(config);
  return client;
}

function nowIso() {
  return new Date().toISOString();
}

function isoAfter(ms) {
  return new Date(Date.now() + ms).toISOString();
}

module.exports = { getDb, databaseConfig, nowIso, isoAfter };
