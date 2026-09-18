/**
 * 07_template_literal_types.ts — type-checked strings
 *
 * PURPOSE: instead of a bare `string` for events or routes, template
 * literal types make the checker understand the SHAPE of your strings.
 * Run with:
 *
 *   npx tsx 07_template_literal_types.ts
 *
 * WHAT WE LEARN: whole categories of string typos ("usr:created",
 * "user:creatd") become compile errors. Combine a union of domains with a
 * union of actions and the compiler computes the cross product — this is
 * exactly how library authors type event maps (e.g. DOM event handlers,
 * i18n keys, typed routes).
 */

type Domain = "user" | "order";
type Action = "created" | "updated" | "deleted";

// Cross product: "user:created" | "user:updated" | … | "order:deleted"
type EventName = `${Domain}:${Action}`;

function onEvent(name: EventName, cb: () => void): void {
  console.log(`listening for ${name}`);
  cb();
}

onEvent("user:created", () => console.log("  → welcome email queued"));
onEvent("order:deleted", () => console.log("  → free up inventory"));
// onEvent("usr:created", () => {});  // ← compile error: unknown domain
// onEvent("user:archive", () => {}); // ← compile error: unknown action

// Pattern matching on string shapes: keys that start with "on"
type Settings = { onThemeChange: () => void; onSync: () => void; port: number };
type Handlers<T> = {
  [K in keyof T as K extends `on${string}` ? K : never]: T[K];
};

type SettingsHandlers = Handlers<Settings>; // { onThemeChange; onSync }
const h: SettingsHandlers = {
  onThemeChange: () => console.log("theme changed"),
  onSync: () => console.log("synced"),
};
h.onThemeChange();
