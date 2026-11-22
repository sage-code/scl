"use strict";

const { HttpError, sendJson, readJson, getQuery, assertSameOrigin, assertSameOriginJson, handle } = require("../_lib/http");
const { requireRegistered } = require("../_lib/session");
const { addTestimonial, updateTestimonial, deleteTestimonial } = require("../_lib/community");

module.exports = handle(async (req, res) => {
  if (req.method === "POST") {
    assertSameOriginJson(req);
    const session = await requireRegistered(req);
    const body = await readJson(req);
    const targetId = String(body.user_id || body.public_id || "").trim();
    if (!targetId) {
      throw new HttpError(400, "Target profile ID is required.");
    }
    const testimonial = await addTestimonial(session.user.id, targetId, body.content);
    sendJson(res, 201, { testimonial });
    return;
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    assertSameOriginJson(req, ["PATCH", "PUT"]);
    const session = await requireRegistered(req);
    const body = await readJson(req);
    const testimonialId = String(body.id || getQuery(req).id || "").trim();
    if (!testimonialId) {
      throw new HttpError(400, "Testimonial ID is required.");
    }
    const testimonial = await updateTestimonial(session.user.id, testimonialId, body.content);
    sendJson(res, 200, { testimonial });
    return;
  }

  if (req.method === "DELETE") {
    assertSameOrigin(req, ["DELETE"]);
    const session = await requireRegistered(req);
    const testimonialId = String(getQuery(req).id || "").trim();
    if (!testimonialId) {
      throw new HttpError(400, "Testimonial ID is required.");
    }
    await deleteTestimonial(session.user.id, testimonialId);
    sendJson(res, 200, { deleted: true });
    return;
  }

  throw new HttpError(405, "Method not allowed.");
});
