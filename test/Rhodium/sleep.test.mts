import * as Rhodium from "@/mod.mts"
import { assertAlmostEquals } from "@std/assert"

for (const sleepMS of [20, 50, 100, 200, 500]) {
	Deno.test("sleep " + sleepMS, async () => {
		const begin = performance.now()
		await Rhodium.sleep(sleepMS)
		assertAlmostEquals(performance.now() - begin, sleepMS, 10)
	})
}

Deno.test("sleep cancelled", async () => {
	const rhSleep = Rhodium.sleep(1000)
	const begin = performance.now()
	rhSleep.cancel()
	await rhSleep.promise
	assertAlmostEquals(performance.now() - begin, 0, 10)
})

Deno.test("sleep cancelled after a delay", async () => {
	const rhSleep = Rhodium.sleep(2000)
	await Rhodium.sleep(50)
	const begin = performance.now()
	rhSleep.cancel()
	await rhSleep.promise
	assertAlmostEquals(performance.now() - begin, 0, 10)
})
