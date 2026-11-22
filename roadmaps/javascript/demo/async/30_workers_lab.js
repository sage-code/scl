/**
 * 30_workers_lab.js — real parallelism with Node worker_threads.
 *
 * Run with: node 30_workers_lab.js
 * Browsers call them Web Workers, Node calls them worker_threads — the model is
 * identical: spawn a thread, pass messages, share nothing by default.
 */

const { isMainThread, Worker, parentPort, workerData } = require("node:worker_threads");

function burn(ms) {
  // CPU-bound work: blocks its thread completely. This is what workers offload.
  const end = Date.now() + ms;
  let sink = 0;
  while (Date.now() < end) sink += Math.sqrt(sink + 1);
  return sink;
}

async function main() {
  // --- Part 1: the main-thread baseline --------------------------------------
  const t0 = Date.now();
  burn(300);
  burn(300);
  const serialMs = Date.now() - t0;
  console.log(`2 blocks on ONE thread: ${serialMs}ms (they can only queue)`);

  // --- Part 2: two workers run in PARALLEL on real threads -------------------
  const t1 = Date.now();
  await Promise.all([spawnWorker(300), spawnWorker(300)]);
  const parallelMs = Date.now() - t1;
  console.log(`2 blocks on TWO threads: ${parallelMs}ms (they overlap)`);

  // --- Part 3: messages are copied; buffers can be TRANSFERRED ---------------
  const size = 16 * 1024 * 1024; // 16 MB
  const shared = new ArrayBuffer(size);
  const t2 = Date.now();
  await spawnWorker(0, shared);           // transferList: ownership MOVES, no clone
  console.log(`transferred 16MB buffer: ${Date.now() - t2}ms (copy cost ~0 — this figure is worker startup)`);
  console.log(`byteLength after transfer on main thread: ${shared.byteLength}`);

  console.log(`speedup: ${(serialMs / parallelMs).toFixed(2)}x`);
  // Expected shape of the output (numbers vary by machine):
  // 2 blocks on ONE thread: 600ms (they can only queue)
  // 2 blocks on TWO threads: 396ms (they overlap)
  // transferred 16MB buffer: 57ms (copy cost ~0 — this figure is worker startup)
  // byteLength after transfer on main thread: 0
  // speedup: 1.52x
}

function spawnWorker(ms, buffer) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { ms, buffer },
      transferList: buffer ? [buffer] : [], // ArrayBuffers move by REFERENCE — zero copy
    });
    worker.on("message", resolve);
    worker.on("error", reject);
  });
}

if (!isMainThread) {
  // We are INSIDE a worker now: burn CPU if asked, report back, exit.
  const { ms, buffer } = workerData;
  if (ms > 0) burn(ms);
  if (buffer) parentPort.postMessage(`worker touched ${buffer.byteLength} bytes`);
  else parentPort.postMessage("done");
} else {
  main();
}
