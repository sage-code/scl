// 05_app.js — loaded by 05_script_external.html with <script src defer>.
// Everything here runs AFTER the page is parsed, so the elements exist.

const title = document.querySelector("#title");
title.textContent = "Loaded from an external file";

const message = document.querySelector("#message");
message.textContent = "If you can read this, app.js ran and found both elements.";

console.log("05_app.js ran after the HTML was ready (that is what defer does).");
