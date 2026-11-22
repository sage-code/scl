// 11 - Component-oriented programming: Web Components, the browser's native
// component model. A component is a self-contained, reusable unit with a
// defined interface (its attributes and events) — you compose an
// application from these units, rather than from classes and inheritance.

class CounterButton extends HTMLElement {
  #count = 0; // the component's own encapsulated state

  connectedCallback() {
    // The component renders itself; nothing outside it touches its internals.
    this.innerHTML = `<button>Count: ${this.#count}</button>`;
    this.querySelector('button').addEventListener('click', () => {
      this.#count += 1;
      this.querySelector('button').textContent = `Count: ${this.#count}`;
      // A component communicates outward through events, not shared state.
      this.dispatchEvent(new CustomEvent('count-changed', { detail: this.#count }));
    });
  }
}

// Registering the component makes <counter-button> usable anywhere, in any
// page, by anyone — the way you'd drop a library into a project. This is
// the essence of component-oriented programming: build once, compose freely.
customElements.define('counter-button', CounterButton);

// Usage, anywhere in the page's HTML:
//   <counter-button></counter-button>
//   <script>
//     document.querySelector('counter-button')
//       .addEventListener('count-changed', e => console.log(e.detail));
//   </script>
