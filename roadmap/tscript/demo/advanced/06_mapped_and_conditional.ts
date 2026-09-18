/**
 * 06_mapped_and_conditional.ts — types that compute types
 *
 * PURPOSE: show the two workhorse operators of type-level programming:
 * mapped types (transform every property) and conditional types (choose a
 * type by a condition). Run with:
 *
 *   npx tsx 06_mapped_and_conditional.ts
 *
 * WHAT WE LEARN: types are a small functional language over other types.
 * Mapped types keep transformations in sync with your domain types for
 * free — add a field to `Task` and `TaskPatch`/`TaskId` grow it
 * automatically. Conditional types (`extends ? :`) let one definition
 * describe a whole family, like the `Unwrap` helper below.
 */

type Task = {
  id: number;
  title: string;
  done: boolean;
};

// Mapped type: same keys, every property optional — "patch object"
type TaskPatch = { [K in keyof Task]?: Task[K] };

// Mapped type with a filter: keep only the string properties
type StringFields<T> = {
  [K in keyof T as T[K] extends string ? K : never]: T[K];
};

// Conditional type: unwrap an array's element type, or pass through
type Unwrap<T> = T extends (infer U)[] ? U : T;

const patch: TaskPatch = { done: true };        // valid: partial by design
// const bad: TaskPatch = { done: "yes" };      // ← compile error

type TaskStrings = StringFields<Task>;          // { title: string }
type NumberTask = Unwrap<Task[]>;               // Task
type Plain = Unwrap<number>;                    // number

const titleOnly: TaskStrings = { title: "ship S5" };
console.log(patch, titleOnly);

// Runtime proof that the computed types are what we expect:
const check: NumberTask = { id: 1, title: "write demos", done: false };
const plain: Plain = 7;
console.log(check, plain);
