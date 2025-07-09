import { assertEquals, assertRejects } from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"

Deno.test("all never reject", async () => {
	const result: ["res1", "res2"] = await Rhodium.all([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, ["res1", "res2"])
})

Deno.test("one always rejects", () => {
	assertRejects(() => {
		const result: Rhodium<never, EvalError> = Rhodium.all([
			Rhodium.resolve("res1"),
			Rhodium.resolve("res2"),
			Rhodium.reject(new EvalError()),
		])
		return result.promise
	}, EvalError)
})

Deno.test("one sometimes rejects", async () => {
	const result: Rhodium<["res1", "res2", "res3"], "err1"> = Rhodium.all([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rhodium<"res3", "err1">,
	])
	assertEquals(await result, ["res1", "res2", "res3"])
})

Deno.test("empty array", async () => {
	const result: Rhodium<[], never> = Rhodium.all([])
	assertEquals(await result, [])
})
