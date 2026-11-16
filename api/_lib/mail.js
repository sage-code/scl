"use strict";

// Transactional email through the Resend REST API (no SDK dependency).
// Uses the domain-restricted RESEND_SEND_KEY; the full-access key never ships.

const { requestHost } = require("./http");

const RESEND_ENDPOINT = "https://api.resend.com/emails";

function escapeHtml(value) {
  return String(value == null ? "" : value).replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[ch]);
}

// Absolute site URL for links in emails. Never trusts the Host header except
// for local development, so a forged Host cannot redirect reset links.
function siteUrl(req) {
  if (process.env.APP_URL) {
    return process.env.APP_URL.replace(/\/+$/, "");
  }
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  const host = requestHost(req);
  if (/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) {
    return `http://${host}`;
  }
  return "https://sagecode.org";
}

function layout(title, intro, buttonLabel, link, footnote) {
  return `<!doctype html>
<html><body style="margin:0;padding:24px;background:#f4f5f7;font-family:Segoe UI,Arial,sans-serif;color:#1f2328">
  <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:8px;padding:28px">
    <h1 style="font-size:20px;margin:0 0 12px">${escapeHtml(title)}</h1>
    <p style="font-size:15px;line-height:1.5;margin:0 0 20px">${escapeHtml(intro)}</p>
    <p style="margin:0 0 20px"><a href="${escapeHtml(link)}" style="display:inline-block;background:#1f6feb;color:#ffffff;text-decoration:none;padding:10px 18px;border-radius:6px;font-weight:600">${escapeHtml(buttonLabel)}</a></p>
    <p style="font-size:13px;line-height:1.5;color:#57606a;margin:0 0 8px">Or paste this link into your browser:<br><span style="word-break:break-all">${escapeHtml(link)}</span></p>
    <p style="font-size:13px;line-height:1.5;color:#57606a;margin:16px 0 0">${escapeHtml(footnote)}</p>
  </div>
  <p style="text-align:center;font-size:12px;color:#8c959f;margin:16px 0 0">Sage-Code Laboratory</p>
</body></html>`;
}

const TEMPLATES = {
  verify: (handle, link) => ({
    subject: "Confirm your Sage-Code roadmap account",
    html: layout(
      `Welcome, ${handle}`,
      "Confirm your email address to finish creating your Sage-Code roadmap account. Your roadmap progress is already saved.",
      "Confirm email",
      link,
      "This link expires in 24 hours. If you did not create an account, you can ignore this email."
    ),
    text: `Welcome, ${handle}.\n\nConfirm your email for your Sage-Code roadmap account:\n${link}\n\nThis link expires in 24 hours. If you did not create an account, ignore this email.`
  }),
  reset: (handle, link) => ({
    subject: "Reset your Sage-Code roadmap password",
    html: layout(
      `Password reset for ${handle}`,
      "Someone asked to reset the password for your Sage-Code roadmap account. Use the button below to choose a new one.",
      "Choose a new password",
      link,
      "This link expires in 1 hour and works once. If you did not ask for a reset, you can ignore this email; your password stays the same."
    ),
    text: `Password reset for ${handle}.\n\nChoose a new password:\n${link}\n\nThis link expires in 1 hour. If you did not ask for this, ignore this email.`
  })
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Sends one email. Never throws: returns { ok, id } or { ok: false, error } so a
// mail outage cannot block sign-up. Retries network errors, 429 and 5xx.
async function sendTemplate(kind, to, handle, link, idempotencyKey) {
  const apiKey = process.env.RESEND_SEND_KEY || "";
  if (!apiKey) {
    console.warn("[mail] RESEND_SEND_KEY is not set; email not sent.");
    return { ok: false, error: "Email is not configured." };
  }

  const content = TEMPLATES[kind](handle || "there", link);
  const payload = {
    from: process.env.RESEND_FROM || "Sage-Code <noreply@mail.sagecode.org>",
    to: [to],
    subject: content.subject,
    html: content.html,
    text: content.text
  };
  if (process.env.RESEND_REPLY_TO) {
    payload.reply_to = process.env.RESEND_REPLY_TO;
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    let response;
    try {
      response = await fetch(RESEND_ENDPOINT, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey
        },
        body: JSON.stringify(payload)
      });
    } catch (error) {
      console.warn(`[mail] ${kind} attempt ${attempt + 1} network error:`, error.message);
      await sleep(400 * (attempt + 1));
      continue;
    }

    const body = await response.json().catch(() => ({}));
    if (response.ok) {
      console.log(`[mail] sent ${kind} email id=${body.id}`);
      return { ok: true, id: body.id };
    }

    if (response.status === 429 || response.status >= 500) {
      const retryAfter = Number(response.headers.get("retry-after")) || attempt + 1;
      console.warn(`[mail] ${kind} attempt ${attempt + 1} got ${response.status}; retrying.`);
      await sleep(Math.min(retryAfter, 3) * 1000);
      continue;
    }

    console.error(`[mail] ${kind} rejected (${response.status}):`, body.message || body);
    return { ok: false, error: body.message || `Resend returned ${response.status}` };
  }

  return { ok: false, error: "Email service unavailable." };
}

module.exports = { siteUrl, sendTemplate, escapeHtml };
