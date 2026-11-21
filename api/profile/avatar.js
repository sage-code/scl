"use strict";

const { put, del } = require("@vercel/blob");
const { getDb, nowIso } = require("../_lib/db");
const { HttpError, sendJson, clientIp, assertSameOrigin, handle } = require("../_lib/http");
const { requireSession } = require("../_lib/session");

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const HOUR_MS = 60 * 60 * 1000;
const USER_UPLOADS_PER_HOUR = 6;
const IP_UPLOADS_PER_HOUR = 18;

const AVATAR_TYPES = {
  "image/jpeg": { extension: "jpg", matches: (bytes) => bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff },
  "image/png": {
    extension: "png",
    matches: (bytes) => bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  },
  "image/webp": {
    extension: "webp",
    matches: (bytes) => bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
  }
};

async function countRecent(kind, subject) {
  const result = await getDb().execute({
    sql: "select count(*) as n from auth_events where kind = ? and subject = ? and created_at > ?",
    args: [kind, subject, new Date(Date.now() - HOUR_MS).toISOString()]
  });
  return Number(result.rows[0].n);
}

async function logEvent(kind, subject) {
  await getDb().execute({
    sql: "insert into auth_events (kind, subject, created_at) values (?, ?, ?)",
    args: [kind, subject, nowIso()]
  });
}

async function readAvatar(req) {
  const declaredLength = Number(req.headers["content-length"] || 0);
  if (declaredLength > MAX_AVATAR_BYTES) {
    throw new HttpError(413, "Picture must be 2 MB or smaller.");
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_AVATAR_BYTES) {
      throw new HttpError(413, "Picture must be 2 MB or smaller.");
    }
    chunks.push(bytes);
  }
  if (size === 0) {
    throw new HttpError(400, "Choose an image file to upload.");
  }
  return Buffer.concat(chunks, size);
}

module.exports = handle(async (req, res) => {
  assertSameOrigin(req, ["POST", "DELETE"]);
  const session = await requireSession(req);
  const db = getDb();
  const mediaToken = String(process.env.MEDIA_READ_WRITE_TOKEN || "").trim();

  if (req.method === "DELETE") {
    const previousUrl = session.user.avatar_url;
    const now = nowIso();
    await db.execute({
      sql: "update users set avatar_url = null, avatar_path = null, updated_at = ? where id = ?",
      args: [now, session.user.id]
    });
    try {
      await db.execute({
        sql: "update community_members set avatar_url = null, avatar_path = null, updated_at = ? where user_id = ?",
        args: [now, session.user.id]
      });
    } catch (_error) {
      // Test schemas may omit community_members.
    }

    let warning = null;
    if (previousUrl && mediaToken) {
      try {
        await del(previousUrl, { token: mediaToken });
      } catch (error) {
        console.error("[profile/avatar] failed to delete previous blob:", error.message);
        warning = "Picture removed from your profile, but the previous image file could not be deleted.";
      }
    }

    sendJson(res, 200, { avatar_url: null, warning });
    return;
  }

  const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  const imageType = AVATAR_TYPES[contentType];
  if (!imageType) {
    throw new HttpError(415, "Picture must be a JPEG, PNG, or WebP image.");
  }

  const ip = clientIp(req);
  if ((await countRecent("profile-avatar-user", session.user.id)) >= USER_UPLOADS_PER_HOUR
    || (await countRecent("profile-avatar-ip", ip)) >= IP_UPLOADS_PER_HOUR) {
    throw new HttpError(429, "Too many picture uploads. Try again in an hour.");
  }

  const bytes = await readAvatar(req);
  if (!imageType.matches(bytes)) {
    throw new HttpError(415, "Image file contents do not match the declared file type.");
  }

  const mediaStoreId = String(process.env.MEDIA_STORE_ID || "").trim();
  if (!mediaStoreId || !mediaToken) {
    throw new HttpError(503, "Avatar storage is not configured.");
  }

  const blob = await put(
    `profiles/${mediaStoreId}/avatars/${session.user.id}/avatar.${imageType.extension}`,
    bytes,
    {
      access: "public",
      addRandomSuffix: true,
      contentType,
      token: mediaToken
    }
  );

  const previousUrl = session.user.avatar_url;
  try {
    const now = nowIso();
    await db.execute({
      sql: "update users set avatar_url = ?, avatar_path = ?, updated_at = ? where id = ?",
      args: [blob.url, blob.pathname, now, session.user.id]
    });
    try {
      await db.execute({
        sql: "update community_members set avatar_url = ?, avatar_path = ?, updated_at = ? where user_id = ?",
        args: [blob.url, blob.pathname, now, session.user.id]
      });
    } catch (_error) {
      // Test schemas may omit community_members.
    }
  } catch (error) {
    try {
      await del(blob.url, { token: mediaToken });
    } catch (cleanupError) {
      console.error("[profile/avatar] failed to clean up unreferenced upload:", cleanupError.message);
    }
    throw error;
  }

  await logEvent("profile-avatar-user", session.user.id);
  await logEvent("profile-avatar-ip", ip);

  let cleanupWarning = null;
  if (previousUrl && previousUrl !== blob.url) {
    try {
      await del(previousUrl, { token: mediaToken });
    } catch (error) {
      console.error("[profile/avatar] failed to remove previous avatar:", error.message);
      cleanupWarning = "New picture saved, but the previous image could not be removed.";
    }
  }

  sendJson(res, 201, {
    avatar_url: blob.url,
    warning: cleanupWarning
  });
});

module.exports.config = {
  api: {
    bodyParser: false
  }
};
