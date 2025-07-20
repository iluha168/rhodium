import { Rhodium } from "@/index.mts"
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
