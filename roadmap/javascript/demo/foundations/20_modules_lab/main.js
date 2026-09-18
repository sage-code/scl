// 20_modules_lab/main.js — the entry module: imports what it needs.
// Needs HTTP (modules refuse file://):  python -m http.server 8000
// then open http://localhost:8000/.../20_modules_lab/main.html

import stamp, { log, setLevel } from "./logger.js"; // default + named imports

setLevel("debug");        // use the module's API to change its private state
log(stamp());             // default import — any name we choose
log("modules keep every variable private unless exported");

// document.querySelector("#out").textContent = stamp(); // (in the browser page)
