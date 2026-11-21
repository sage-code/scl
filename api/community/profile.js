"use strict";

const { HttpError, sendJson, readJson, assertSameOriginJson, handle } = require("../_lib/http");
const { requireRegistered } = require("../_lib/session");
const { getQualifiedTracks, getMember, saveMember, validateProfile } = require("../_lib/community");

async function eligibility(user) {
  const tracks = await getQualifiedTracks(user);
  return {
    email_verified: !!user.email_verified_at,
    qualified_tracks: tracks,
    eligible: tracks.length > 0
  };
}

module.exports = handle(async (req, res) => {
  if (req.method === "GET") {
    const session = await requireRegistered(req);
    const qualification = await eligibility(session.user);
    sendJson(res, 200, {
      ...qualification,
      profile: await getMember(session.user.id)
    });
    return;
  }
  if (req.method !== "POST") {
    throw new HttpError(405, "Method not allowed.");
  }

  assertSameOriginJson(req);
  const session = await requireRegistered(req);
  if (!session.user.email_verified_at) {
    throw new HttpError(403, "Confirm your email before claiming a community profile.");
  }
  const body = await readJson(req);
  const profile = validateProfile(body);
  const tracks = await getQualifiedTracks(session.user);
  let qualifiedTrack = tracks.find((track) => track.track === body.qualified_track);
  if (!qualifiedTrack) {
    const existingMember = await getMember(session.user.id);
    if (existingMember && existingMember.is_legacy_verified) {
      qualifiedTrack = {
        track: existingMember.qualified_track || "cse",
        topic: existingMember.qualified_topic || "fundamentals"
      };
    } else {
      throw new HttpError(403, "Pass quiz sets A, B, and C for a roadmap before claiming VCP authentication.");
    }
  }

  const savedProfile = await saveMember(session.user.id, profile, qualifiedTrack);
  sendJson(res, 200, { profile: savedProfile });
});
