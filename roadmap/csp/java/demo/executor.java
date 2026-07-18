// Example
Executor executor = Executors.newFixedThreadPool(10);

// Methods
static CompletableFuture<Void> runAsync(Runnable runnable, Executor executor)
static <U> CompletableFuture<U> supplyAsync(Supplier<U> supplier, Executor executor)
