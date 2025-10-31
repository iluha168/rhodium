import { assertEquals, assertRejects } from "assert"
import type { Errored, Rhodium as Rh } from "@/mod.mts"
import * as Rhodium from "@/mod.mts"

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
	const promise: Rh<"handled", never> = Rhodium
		.reject("err")
		.catch(() => "handled" as const)
	assertEquals(await promise, "handled")
})

Deno.test("infers callback argument type", async () => {
	const promise: Rh<"err1", never> = Rhodium
		.reject("err1")
		.catch((err) => {
			const check: "err1" = err
			return check
		})
	assertEquals(await promise, "err1")
})

class ErrorA extends Error {
	code = 1 as const
}
class ErrorB extends Error {
	code = 2 as const
}

Deno.test("catchFilter caught", async () => {
	assertEquals(
		await Rhodium
			.reject(new ErrorA())
			.then(() => Rhodium.reject(new ErrorB()))
			.catchFilter((e) => e instanceof ErrorA, () => null),
		null,
	)
})

Deno.test("catchFilter not satisfied", () => {
	assertRejects(() =>
		Rhodium
			.reject(new ErrorB())
			.catchFilter((e) => e instanceof ErrorA, () => null)
			.promise, ErrorB)
})
