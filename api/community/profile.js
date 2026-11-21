"use strict";

const { HttpError, sendJson, readJson, assertSameOriginJson, handle } = require("../_lib/http");
const { requireRegistered } = require("../_lib/session");
const {
  getQualifiedTracks,
  getMember,
  getMemberByPublicId,
  getViewerRoleInfo,
  getAllowedRolesForEdit,
  canEditProfile,
  saveMember,
  validateProfile
} = require("../_lib/community");

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
  const viewerInfo = await getViewerRoleInfo(session.user.id);
  const targetPublicId = typeof body.target_public_id === "string" ? body.target_public_id.trim() : "";

  let targetUserId = session.user.id;
  let existingMember = await getMember(session.user.id);
  let isOwner = true;

  if (targetPublicId && (!existingMember || targetPublicId !== existingMember.public_id)) {
    const targetRecord = await getMemberByPublicId(targetPublicId);
    if (!targetRecord) {
      throw new HttpError(404, "Target community profile not found.");
    }
    targetUserId = targetRecord.user_id;
    existingMember = targetRecord.member;
    isOwner = targetUserId === session.user.id;
  }

  const currentRole = existingMember ? (existingMember.role || "Student") : "Student";
  if (!canEditProfile(viewerInfo, isOwner, currentRole)) {
    throw new HttpError(403, "You do not have permission to edit this profile.");
  }

  if (profile.role !== undefined && profile.role !== currentRole) {
    const allowedRoles = getAllowedRolesForEdit(viewerInfo, isOwner, currentRole);
    if (allowedRoles.indexOf(profile.role) === -1) {
      throw new HttpError(
        403,
        isOwner ? "You cannot change your own role." : "You do not have permission to assign that role."
      );
    }
  }

  let qualifiedTrack;
  if (!isOwner && existingMember) {
    qualifiedTrack = {
      track: existingMember.qualified_track || "cse",
      topic: existingMember.qualified_topic || "fundamentals"
    };
  } else {
    const tracks = await getQualifiedTracks(session.user);
    qualifiedTrack = tracks.find((track) => track.track === body.qualified_track);
    if (!qualifiedTrack) {
      if (existingMember && existingMember.is_legacy_verified) {
        qualifiedTrack = {
          track: existingMember.qualified_track || "cse",
          topic: existingMember.qualified_topic || "fundamentals"
        };
      } else {
        throw new HttpError(403, "Pass quiz sets A, B, and C for a roadmap before claiming VCP authentication.");
      }
    }
  }

  const savedProfile = await saveMember(targetUserId, profile, qualifiedTrack);
  sendJson(res, 200, { profile: savedProfile });
});
