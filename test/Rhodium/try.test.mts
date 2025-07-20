import {
	assertAlmostEquals,
	assertEquals,
	assertRejects,
} from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"
import { timed } from "../util/timed.ts"

Deno.test("collapses all possible return types", async () => {
	const getPromise = () => {
		const promise: Rhodium<"couldMakeErr1", "err1"> = Rhodium
			.try(
				(chance) =>
					chance > 0.5
						? Rhodium.resolve("couldMakeErr1")
						: Rhodium.reject("err1"),
				Math.random(),
			)
		return promise.catch((arg) => arg)
	}
	const result = await getPromise()
	assertEquals(result === "couldMakeErr1" || result === "err1", true)
})

Deno.test("cancellable", async () => {
	const elapsed = await timed(() =>
		Rhodium
			.try(() => Rhodium.sleep(500))
			.cancel()
	)
	assertAlmostEquals(elapsed, 0, 10)
})

Deno.test("rejects", () => {
	assertRejects(() =>
		Rhodium.try(() => {
			throw 10
		}).promise
	)
})
