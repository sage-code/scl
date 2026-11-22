// 15_objects_lab.js — objects: literals, methods, this, freeze, prototypes.
// Run:   node 15_objects_lab.js

// A literal: named slots, order preserved. Write { firstName }, not {"first-name"}.
const user = {
  firstName: "Ada",
  role: "admin",
  isActive: true,
  // a METHOD: a property that holds a function. Inside it, `this` is the object.
  describe() {
    return `${this.firstName} (${this.role})`;
  },
};
console.log(user.describe());          // Ada (admin)
console.log(user["role"], user.role);  // admin admin — dot vs bracket access
user.email = "ada@calc.dev";           // add at any time
delete user.isActive;                  // remove
console.log(Object.keys(user));        // [ 'firstName', 'role', 'describe', 'email' ]
console.log(Object.hasOwn(user, "role")); // true — OWN property (not inherited)

// FREEZE is shallow: the top level locks, nested objects stay editable.
const settings = Object.freeze({ theme: "dark", editor: { font: "mono" } });
// settings.theme = "light";           // TypeError in strict mode (silent fail otherwise)
settings.editor.font = "sans";         // the nested object was NOT frozen
console.log(settings.editor.font);     // sans

// The prototype chain: one object lending abilities to another.
const greeter = {
  greet() { return `hello, ${this.name}`; },
};
const ada = Object.create(greeter); // ada's PROTOTYPE is greeter
ada.name = "Ada";
console.log(ada.greet());               // hello, Ada — found one level up
console.log(Object.hasOwn(ada, "greet"));   // false — it is inherited
console.log(Object.hasOwn(ada, "name"));    // true — it is owned

// Expected output:
//   Ada (admin)
//   admin admin
//   [ 'firstName', 'role', 'describe', 'email' ]
//   true
//   sans
//   hello, Ada
//   false
//   true
