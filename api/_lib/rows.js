"use strict";

const { HttpError } = require("./http");

const MAX_ROWS = 500;

function text(value, name, max) {
  const result = String(value == null ? "" : value).trim();
  if (!result) {
    throw new HttpError(400, `${name} is required.`);
  }
  if (result.length > max) {
    throw new HttpError(400, `${name} is too long.`);
  }
  return result;
}

function roadmapCode(value) {
  return text(value, "roadmap", 120);
}

function topicKey(value) {
  return text(value, "topic_key", 400);
}

function optionalPrefix(value) {
  if (value === undefined || value === null || value === "") {
    return "";
  }
  return text(value, "prefix", 400);
}

function rowList(value) {
  if (!Array.isArray(value)) {
    throw new HttpError(400, "rows must be an array.");
  }
  if (value.length > MAX_ROWS) {
    throw new HttpError(400, `At most ${MAX_ROWS} rows per request.`);
  }
  return value;
}

function keyList(value) {
  if (value === undefined) {
    return null;
  }
  return rowList(value).map(topicKey);
}

// Prefix match without LIKE, so % and _ inside keys are not wildcards.
const PREFIX_CLAUSE = "substr(topic_key, 1, length(?)) = ?";

module.exports = { roadmapCode, topicKey, optionalPrefix, rowList, keyList, PREFIX_CLAUSE };
