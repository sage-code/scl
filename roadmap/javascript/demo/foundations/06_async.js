// 06_async.js — async: runs as soon as it is downloaded; order is NOT guaranteed.
console.log("2 or 3. The async script ran — as soon as it was downloaded.");

// It may run BEFORE the #done element below the scripts was parsed.
const done = document.querySelector("#done");
if (done) {
  done.textContent += " async ran.";
} else {
  console.log("The async script ran BEFORE #done existed — that is what async means.");
}
