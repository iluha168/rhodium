import { assertEquals, assertRejects } from "jsr:@std/assert"
import { Errored, Rhodium } from "../../src/mod.mts"

Deno.test("does nothing with no args", () => {
	assertRejects(() => {
		const promise = Rhodium
			.reject("err")
			.then(() => "value" as const)
			.catch()
		const _check: Errored<typeof promise> = "err"
		return promise.promise
	}, "err")
})

Deno.test("removes error type", async () => {
	const promise: Rhodium<"handled", never> = Rhodium
		.reject("err")
		.catch(() => "handled" as const)
	assertEquals(await promise, "handled")
})

Deno.test("infers callback argument type", async () => {
	const promise: Rhodium<"err1", never> = Rhodium
		.reject("err1")
		.catch((err) => {
			const check: "err1" = err
			return check
		})
	assertEquals(await promise, "err1")
})
