import * as Rhodium from "@/mod.mts"
import { assertAlmostEquals } from "jsr:@std/assert"
import { timed } from "../util/timed.ts"

const sleepMS = 200

Deno.test("sleep", async () => {
	const elapsed = await timed(() => Rhodium.sleep(sleepMS))
	assertAlmostEquals(elapsed, sleepMS, 10)
})

Deno.test("sleep cancelled", async () => {
	const elapsed = await timed(() => Rhodium.sleep(sleepMS).cancel())
	assertAlmostEquals(elapsed, 0, 10)
})

Deno.test("sleep cancelled after a delay", async () => {
	const rhSleep = Rhodium.sleep(sleepMS)
	await Rhodium.sleep(50)
	const elapsed = await timed(() => rhSleep.cancel())
	assertAlmostEquals(elapsed, 0, 10)
})
