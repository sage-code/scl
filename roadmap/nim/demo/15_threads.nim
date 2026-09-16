# 15_threads.nim — threads, channels and async.
#
# Run it with:  nim c -r 15_threads.nim
# Nim 1.x needed `--threads:on`; Nim 2.x enables thread support by default, and
# `--mm:orc` (also the default) is the only memory manager suitable for threads.
#
# The rule that matters: threads share nothing implicit. A `seq`, `string` or
# `ref` is NOT safe to touch from two threads unless you use `var` parameters,
# channels or explicit synchronization. The three tools below cover the usual
# cases:
#   System `Thread[T]` + `createThread` — OS threads, one stack each
#   `Channel[T]`                        — a queue that copies values between
#                                         threads (requires thread support)
#   `std/atomics`                       — lock-free counters, no mutex
#
# For task-level parallelism in real code, `std/threadpool` is deprecated:
# use a maintained library such as `taskpools`, `malebolgia` or `weave`.

import std/[atomics, strutils]

# A global Atomic is zero-initialized. `fetchAdd` is a single CPU instruction,
# so the counter is correct without a lock — the classic alternative to a mutex.
var hits: Atomic[int]

proc worker(id: int) {.thread.} =
  ## Runs on its own thread. It receives a copy of `id` — no sharing.
  var local = 0
  for i in 1 .. 1000:
    local += i
  discard hits.fetchAdd(local, moRelaxed)      # moRelaxed: order is irrelevant
  echo "  worker ", id, " computed ", local

# Channels connect threads through copied messages, which removes the shared
# mutable state entirely. Open before spawning, close after joining.
var results: Channel[string]
results.open()

proc reporter(id: int) {.thread.} =
  for i in 1 .. 3:
    results.send("reporter " & $id & " message " & $i)

echo "workers:"
var pool: array[4, Thread[int]]
for i in 0 .. 3:
  createThread(pool[i], worker, i + 1)
joinThreads(pool)                              # waits for all of them
echo "total from atomics: ", hits.load()

echo "channels:"
var reporters: array[2, Thread[int]]
for i in 0 .. 1:
  createThread(reporters[i], reporter, i + 1)
joinThreads(reporters)
results.close()                                # after all senders stopped
# Draining after `close` is legal; `tryRecv` would be the non-blocking form.
while results.peek > 0:
  echo "  got: ", results.recv()

# ---------------------------------------------------------------------------
# Async is cooperative concurrency, not parallelism: `{.async.}` procs return a
# Future and suspend at every `await`, letting one thread interleave thousands
# of I/O operations. Do not mix async with blocking thread code — they are two
# different schedulers.
import std/asyncdispatch

proc fetchPage(name: string; delayMs: int): Future[string] {.async.} =
  ## Stands in for a network call: `await` yields the event loop instead of
  ## blocking the thread, so both calls below run concurrently.
  await sleepAsync(delayMs)
  return "content of " & name

proc fetchAll(): Future[seq[string]] {.async.} =
  # `await` on a list of futures waits for all of them at once.
  let pending = @[fetchPage("a", 60), fetchPage("b", 20), fetchPage("c", 40)]
  result = await all(pending)

# `waitFor` runs the event loop until the future completes. Only `asyncCheck`
# or `waitFor` should be used on futures; `discard` on a Future silently drops
# the exception and is a bug.
echo "async:"
let pages = waitFor fetchAll()
for p in pages:
  echo "  ", p

# A void async proc would be called as: `asyncCheck doSomething()`, which keeps
# the error reporting intact — `discard doSomething()` would swallow failures.
