/**
 * 34_worker_pool_sample.js — a minimal worker pool with worker_threads.
 *
 * Run with: node demo/practice/34_worker_pool_sample.js
 *
 * The pool: N long-lived workers, a job queue, and per-job promise resolvers.
 * Same shape as the browser pattern from the Web Workers lesson — only the
 * imports differ.
 */

const { Worker, isMainThread, parentPort, workerData } = require("node:worker_threads");
const os = require("node:os");

// --- The job: CPU-bound on purpose (a big hash-ish sum) ------------------------
function cpuJob(n) {
  let acc = 0;
  for (let i = 0; i < n; i++) acc = (acc + Math.sqrt(i)) % 1e9; // cannot be chunked cheaply
  return acc;
}

// --- Worker side: ask for work, do it, report, ask again ----------------------
if (!isMainThread) {
  const { n } = workerData;
  parentPort.postMessage(cpuJob(n)); // one job per workerData in this simple design
} else {
  main(); // hoisted below — the pool demo runs on the main thread only
}

// --- Main thread: the pool ------------------------------------------------------
async function main() {
class WorkerPool {
  constructor(size) {
    this.idle = Array.from({ length: size }, (_, id) => ({ id, worker: null }));
    this.queue = [];
  }

  run(n) {
    // Jobs resolve when their worker reports back — the caller just awaits.
    return new Promise((resolve, reject) => {
      const job = { n, resolve, reject };
      const slot = this.idle.pop();
      if (slot) this.start(slot, job);
      else this.queue.push(job);
    });
  }

  start(slot, job) {
    const worker = new Worker(__filename, { workerData: { n: job.n } });
    worker.on("message", job.resolve);          // success path
    worker.on("error", job.reject);             // never swallow worker errors
    worker.on("exit", () => {
      this.idle.push(slot);
      const next = this.queue.shift();          // pull the next queued job, if any
      if (next) this.start(this.idle.pop(), next);
    });
  }
}

// --- Demo: 6 CPU-bound jobs over the pool --------------------------------------
const jobs = [30e6, 30e6, 30e6, 30e6, 30e6, 30e6];
const pool = new WorkerPool(Math.min(4, os.cpus().length)); // one worker per core, capped

console.time("pooled");
const results = await Promise.all(jobs.map((n) => pool.run(n))); // all queued at once,
console.timeEnd("pooled");                                       // 4 run in parallel
console.log("checksums:", results.map((r) => r % 1000).join(", "));

// Expected behavior: total time ≈ ceil(6 / 4) × single-job time, NOT 6 × single-job
// time — four cores chew through the queue while the main thread stays responsive.
  console.log("pool finished — all jobs resolved, workers exited");
}
