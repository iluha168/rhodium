import { assertAlmostEquals, assertEquals, assertRejects } from "assert"
import type Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("collapses all possible return types", async () => {
	const getPromise = () => {
		const promise: Rh<"couldMakeErr1", "err1"> = Rhodium
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
	assertRejects(() => Rhodium.try(() => Rhodium.reject(10)).promise)
})

Deno.test("throw also rejects", () => {
	assertRejects(() =>
		Rhodium.try(() => {
			// Sin
			throw new SyntaxError()
		}).promise, SyntaxError)
})
