"use strict";

const { HttpError, sendJson, getQuery, handle } = require("../_lib/http");
const { getPublicMember } = require("../_lib/community");

module.exports = handle(async (req, res) => {
  if (req.method !== "GET") {
    throw new HttpError(405, "Method not allowed.");
  }
  const publicId = String(getQuery(req).public_id || "").trim();
  if (!publicId) {
    throw new HttpError(404, "Community profile not found.");
  }
  const profile = await getPublicMember(publicId);
  if (!profile) {
    throw new HttpError(404, "Community profile not found.");
  }
  sendJson(res, 200, { profile });
});
