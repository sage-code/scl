"use strict";

// Minimal request/response helpers that work both on Vercel's Node runtime and
// on a plain node:http server (scripts/dev-api.js), so nothing depends on
// Vercel-only helpers like res.status().json().

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(res, status, body) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(body));
}

function redirect(res, location) {
  res.statusCode = 302;
  res.setHeader("Location", location);
  res.setHeader("Cache-Control", "no-store");
  res.end();
}

function getQuery(req) {
  if (req.query && typeof req.query === "object") {
    return req.query;
  }

  const url = new URL(req.url || "/", "http://localhost");
  return Object.fromEntries(url.searchParams.entries());
}

async function readJson(req) {
  if (req.body && typeof req.body === "object" && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  let raw = typeof req.body === "string" ? req.body : "";
  if (!raw && !req.body) {
    const chunks = [];
    let size = 0;
    for await (const chunk of req) {
      size += chunk.length;
      if (size > 256 * 1024) {
        throw new HttpError(413, "Request body is too large.");
      }
      chunks.push(chunk);
    }
    raw = Buffer.concat(chunks).toString("utf8");
  } else if (Buffer.isBuffer(req.body)) {
    raw = req.body.toString("utf8");
  }

  if (!raw) {
    return {};
  }

  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    throw new HttpError(400, "Request body must be JSON.");
  }
}

function requestHost(req) {
  return String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim().toLowerCase();
}

// Best-effort client IP for rate limiting (Vercel sets x-forwarded-for / x-real-ip).
function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || String(req.headers["x-real-ip"] || "").trim() || (req.socket && req.socket.remoteAddress) || "unknown";
}

// CSRF guard for state-changing requests: JSON content type (forces a CORS
// preflight cross-origin) and, when the browser sends Origin, the same host.
function assertSameOriginJson(req) {
  if (req.method !== "POST") {
    throw new HttpError(405, "Method not allowed.");
  }

  const contentType = String(req.headers["content-type"] || "").toLowerCase();
  if (contentType.indexOf("application/json") !== 0) {
    throw new HttpError(415, "Content-Type must be application/json.");
  }

  const origin = req.headers.origin;
  if (origin) {
    let originHost = "";
    try {
      originHost = new URL(origin).host.toLowerCase();
    } catch (_error) {
      originHost = "";
    }

    if (!originHost || originHost !== requestHost(req)) {
      throw new HttpError(403, "Cross-origin request rejected.");
    }
  }
}

function parseCookies(req) {
  const header = String(req.headers.cookie || "");
  const cookies = {};
  for (const part of header.split(";")) {
    const index = part.indexOf("=");
    if (index === -1) {
      continue;
    }
    const name = part.slice(0, index).trim();
    if (name) {
      cookies[name] = decodeURIComponent(part.slice(index + 1).trim());
    }
  }
  return cookies;
}

function isSecureRequest(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim();
  if (proto) {
    return proto === "https";
  }
  return !!(req.socket && req.socket.encrypted);
}

function setCookie(req, res, name, value, maxAgeSeconds) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`
  ];
  if (isSecureRequest(req)) {
    parts.push("Secure");
  }

  const existing = res.getHeader("Set-Cookie");
  const list = existing ? [].concat(existing) : [];
  list.push(parts.join("; "));
  res.setHeader("Set-Cookie", list);
}

// Wraps a handler so thrown HttpErrors become JSON responses and anything else
// becomes a logged 500 without leaking internals.
function handle(fn) {
  return async function wrapped(req, res) {
    try {
      await fn(req, res);
    } catch (error) {
      if (error instanceof HttpError) {
        sendJson(res, error.status, { error: error.message });
        return;
      }
      console.error("[api] unexpected error:", error);
      sendJson(res, 500, { error: "Server error. Please try again." });
    }
  };
}

module.exports = {
  HttpError,
  sendJson,
  redirect,
  getQuery,
  readJson,
  requestHost,
  clientIp,
  assertSameOriginJson,
  parseCookies,
  setCookie,
  handle
};
