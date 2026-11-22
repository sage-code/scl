// 16 — Concurrency — run with: swift 16_concurrency.swift  (Swift 5.7+ for top-level await)
//
// async/await, structured tasks and actors: the same ownership rules from demo
// 15, now applied to the question of which task owns which piece of state.

import Foundation

// 1. An async function may suspend in the middle without blocking a thread.
//    `await` marks the suspension point: everything after it may run on a
//    different thread than everything before it.
func loadProfile(id: Int) async -> String {
    try? await Task.sleep(nanoseconds: 20_000_000)   // pretend network latency
    return "profile-\(id)"
}
let one = await loadProfile(id: 1)
print(one)

// 2. async let starts several child tasks at once and awaits them together, so
//    the total time is the slowest child rather than the sum of all of them.
async let second = loadProfile(id: 2)
async let third = loadProfile(id: 3)
let pair = [await second, await third]
print(pair.sorted())

// 3. A task group fans out a number of jobs that is not known until runtime and
//    collects their results in completion order.
func loadAll(ids: [Int]) async -> [String] {
    await withTaskGroup(of: String.self) { group in
        for id in ids { group.addTask { await loadProfile(id: id) } }
        var results: [String] = []
        for await result in group { results.append(result) }
        return results.sorted()
    }
}
let many = await loadAll(ids: [4, 5, 6])
print(many)

// 4. An actor owns its state. Outside code cannot touch it directly: every call
//    is serialised, which removes data races by construction rather than by
//    remembering to lock.
actor Bank {
    private(set) var balance: Int = 0
    func deposit(_ amount: Int) { balance += amount }
    func total() -> Int { balance }
}
let bank = Bank()
await bank.deposit(100)
await bank.deposit(50)
let balance = await bank.total()
print("balance:", balance)

// 5. Many tasks depositing at the same time still add up, because the actor
//    serialises the writes instead of letting them interleave.
await withTaskGroup(of: Void.self) { group in
    for amount in 1...10 { group.addTask { await bank.deposit(amount) } }
}
let afterDeposits = await bank.total()
print("balance after parallel deposits:", afterDeposits)   // 205

// 6. Cancellation is cooperative: cancelling asks the task to stop, and the
//    task decides where it is safe to give up.
let job = Task {
    for step in 1...5 {
        if Task.isCancelled { return "cancelled at step \(step)" }
        try? await Task.sleep(nanoseconds: 5_000_000)
    }
    return "finished all steps"
}
job.cancel()
let outcome = await job.value
print(outcome)

// 7. A global actor marks code that must run somewhere specific. @MainActor is
//    the one you meet first, because UI work belongs to the main thread.
@MainActor
func makeBanner(_ text: String) -> String { "== \(text) ==" }
// Script top-level code is already main-actor isolated (SE-0343), so this is a
// no-op hop here; inside an app it is what moves the work to the main thread.
let banner = await makeBanner("ready")
print(banner)
