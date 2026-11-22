// 06_defer.js — defer: runs after the HTML is parsed, in document order,
// just before the browser fires DOMContentLoaded.
console.log("2 or 3. The defer script ran — after the page was parsed.");

// Safe: with defer, #done always exists by now.
document.querySelector("#done").textContent += " defer ran after the page was ready.";
