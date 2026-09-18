// main.js — the entry module. It imports from utils.js.
// Path rule: imports start with "./" (same folder) and need the extension.
import { greet } from "./utils.js";

const greeting = document.querySelector("#greeting");
greeting.textContent = greet("beginner");

console.log("Module code ran: deferred by default, and its variables stay private.");
