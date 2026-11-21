"use strict";

const { put, del } = require("@vercel/blob");
const { getDb, nowIso } = require("../_lib/db");
const { HttpError, sendJson, assertSameOrigin, handle } = require("../_lib/http");
const { requireRegistered } = require("../_lib/session");
const { getQualifiedTracks } = require("../_lib/community");

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
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

async function readAvatar(req) {
  const declaredLength = Number(req.headers["content-length"] || 0);
  if (declaredLength > MAX_AVATAR_BYTES) {
    throw new HttpError(413, "Avatar must be 2 MB or smaller.");
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_AVATAR_BYTES) {
      throw new HttpError(413, "Avatar must be 2 MB or smaller.");
    }
    chunks.push(bytes);
  }
  if (size === 0) {
    throw new HttpError(400, "Choose an avatar image to upload.");
  }
  return Buffer.concat(chunks, size);
}

module.exports = handle(async (req, res) => {
  assertSameOrigin(req, ["POST", "DELETE"]);
  const session = await requireRegistered(req);
  if (!session.user.email_verified_at) {
    throw new HttpError(403, "Confirm your email before uploading a community avatar.");
  }

  const db = getDb();
  const memberCheck = await db.execute({
    sql: "select avatar_url, is_legacy_verified from community_members where user_id = ?",
    args: [session.user.id]
  });
  const existingRow = memberCheck.rows[0];
  const isLegacyOrAdmin = Number(session.user.is_admin) === 1 || (existingRow && Number(existingRow.is_legacy_verified) === 1);
  if (!isLegacyOrAdmin && (await getQualifiedTracks(session.user)).length === 0) {
    throw new HttpError(403, "Pass quiz sets A, B, and C for a roadmap before claiming VCP authentication.");
  }

  if (req.method === "DELETE") {
    if (!existingRow) {
      throw new HttpError(404, "Community profile not found.");
    }
    const previousUrl = existingRow.avatar_url;
    const now = nowIso();
    await db.execute({
      sql: "update community_members set avatar_url = null, avatar_path = null, updated_at = ? where user_id = ?",
      args: [now, session.user.id]
    });
    try {
      await db.execute({
        sql: "update users set avatar_url = null, avatar_path = null, updated_at = ? where id = ?",
        args: [now, session.user.id]
      });
    } catch (_error) {
      // Test schemas may omit users.avatar_url.
    }
    let warning = null;
    const mediaToken = String(process.env.MEDIA_READ_WRITE_TOKEN || "").trim();
    if (previousUrl && mediaToken) {
      try {
        await del(previousUrl, { token: mediaToken });
      } catch (error) {
        console.error("[community/avatar] failed to remove avatar on delete:", error.message);
        warning = "Avatar reference was removed, but the previous image file could not be deleted.";
      }
    }
    sendJson(res, 200, { avatar_url: null, warning });
    return;
  }

  const contentType = String(req.headers["content-type"] || "").split(";")[0].trim().toLowerCase();
  const imageType = AVATAR_TYPES[contentType];
  if (!imageType) {
    throw new HttpError(415, "Avatar must be a JPEG, PNG, or WebP image.");
  }

  const bytes = await readAvatar(req);
  if (!imageType.matches(bytes)) {
    throw new HttpError(415, "Avatar file contents do not match the declared image type.");
  }

  const mediaStoreId = String(process.env.MEDIA_STORE_ID || "").trim();
  const mediaToken = String(process.env.MEDIA_READ_WRITE_TOKEN || "").trim();
  if (!mediaStoreId || !mediaToken) {
    throw new HttpError(503, "Avatar storage is not configured.");
  }

  const existing = await db.execute({
    sql: "select avatar_url from community_members where user_id = ?",
    args: [session.user.id]
  });
  if (!existing.rows[0]) {
    throw new HttpError(409, "Save your qualified community profile before uploading an avatar.");
  }

  const blob = await put(
    `community/${mediaStoreId}/avatars/${session.user.id}/avatar.${imageType.extension}`,
    bytes,
    {
      access: "public",
      addRandomSuffix: true,
      contentType,
      token: mediaToken
    }
  );
  const previousUrl = existing.rows[0].avatar_url;
  try {
    const now = nowIso();
    await db.execute({
      sql: "update community_members set avatar_url = ?, avatar_path = ?, updated_at = ? where user_id = ?",
      args: [blob.url, blob.pathname, now, session.user.id]
    });
    try {
      await db.execute({
        sql: "update users set avatar_url = ?, avatar_path = ?, updated_at = ? where id = ?",
        args: [blob.url, blob.pathname, now, session.user.id]
      });
    } catch (_error) {
      // Test schemas may omit users.avatar_url.
    }
  } catch (error) {
    try {
      await del(blob.url, { token: mediaToken });
    } catch (cleanupError) {
      console.error("[community/avatar] failed to remove an unreferenced upload:", cleanupError.message);
    }
    throw error;
  }

  let cleanupWarning = null;
  if (previousUrl && previousUrl !== blob.url) {
    try {
      await del(previousUrl, { token: mediaToken });
    } catch (error) {
      console.error("[community/avatar] failed to remove the previous avatar:", error.message);
      cleanupWarning = "The new avatar is saved, but the previous image could not be removed.";
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
