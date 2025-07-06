import { assertEquals } from "jsr:@std/assert"
import { Rhodium } from "../../src/mod.mts"

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
