import { assertEquals, assertRejects } from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"

Deno.test("all never reject", async () => {
	const result: "res1" | "res2" = await Rhodium.race([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, "res1")
})

Deno.test("one always rejects", () => {
	assertRejects(() => {
		const result: Rhodium<"res1" | "res2", EvalError> = Rhodium.race([
			Rhodium.reject(new EvalError()),
			Rhodium.resolve("res1"),
			Rhodium.resolve("res2"),
		])
		return result.promise
	}, EvalError)
})

Deno.test("one sometimes rejects", async () => {
	const result: Rhodium<"res1" | "res2" | "res3", "err1"> = Rhodium.race([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rhodium<"res3", "err1">,
	])
	assertEquals(await result, "res1")
})

Deno.test("all always reject", async () => {
	const createPromise = () => {
		const result: Rhodium<never, "err1" | "err2"> = Rhodium.race([
			Rhodium.reject("err2"),
			Rhodium.reject("err1"),
		])
		return result.catch((errs) => errs)
	}
	assertEquals(await createPromise(), "err2")
})

Deno.test("empty array", () => {
	assertRejects(() => {
		const result: Rhodium<never, never> = Rhodium.race([])
		return result.promise
	})
})
