"use strict";

const { HttpError, sendJson, getQuery, handle } = require("../_lib/http");
const { readSession } = require("../_lib/session");
const { getPublicMemberWithOwnership } = require("../_lib/community");

module.exports = handle(async (req, res) => {
  if (req.method !== "GET") {
    throw new HttpError(405, "Method not allowed.");
  }
  const query = getQuery(req);
  const publicId = String(query.public_id || query.user_id || query["user-id"] || "").trim();
  if (!publicId) {
    throw new HttpError(404, "Community profile not found.");
  }
  const session = await readSession(req);
  const viewerUserId = session && session.user ? session.user.id : null;
  const result = await getPublicMemberWithOwnership(publicId, viewerUserId);
  if (!result) {
    throw new HttpError(404, "Community profile not found.");
  }
  sendJson(res, 200, { profile: result.profile, is_owner: result.is_owner });
});
