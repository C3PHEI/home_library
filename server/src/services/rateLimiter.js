// Einfache Warteschlange pro Anbieter: Anfragen laufen nacheinander und
// mit mindestens minIntervalMs Abstand. Für einen Haushalt reicht das völlig.
//
//   const limit = createRateLimiter(1000)
//   const json = await limit(() => fetch(...))
export function createRateLimiter(minIntervalMs) {
    let queue = Promise.resolve()
    let lastStart = 0

    return function schedule(task) {
        const run = queue.then(async () => {
            const wait = lastStart + minIntervalMs - Date.now()
            if (wait > 0) {
                await new Promise(resolve => setTimeout(resolve, wait))
            }
            lastStart = Date.now()
            return task()
        })
        // Ein Fehler soll die Warteschlange nicht blockieren
        queue = run.catch(() => {})
        return run
    }
}