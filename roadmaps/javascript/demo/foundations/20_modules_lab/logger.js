// 20_modules_lab/logger.js — a module: one private scope, explicit exports.
// Everything not exported is invisible outside — free encapsulation.

let level = "info"; // module-private state

export function log(message) {
  console.log(`[${level}] ${message}`);
}

export function setLevel(next) {
  level = next; // only THIS module can touch the variable
}

export default function stamp() {        // the module's ONE main export
  return `[${new Date().toISOString()}]`;
}
