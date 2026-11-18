"use strict";

const { HttpError, sendJson, handle } = require("../_lib/http");
const { listPublishedMembers } = require("../_lib/community");

module.exports = handle(async (req, res) => {
  if (req.method !== "GET") {
    throw new HttpError(405, "Method not allowed.");
  }
  sendJson(res, 200, { members: await listPublishedMembers() });
});
