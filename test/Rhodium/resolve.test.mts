import { assertEquals, assertStrictEquals } from "jsr:@std/assert"
import { Rhodium } from "../../src/mod.mts"

Deno.test("resolve void", async () => {
	const result: void = await Rhodium.resolve()
	assertStrictEquals(result, undefined)
})

Deno.test("resolve literal", async () => {
	const result: "hi!" = await Rhodium.resolve("hi!")
	assertStrictEquals(result, "hi!")
})

Deno.test("resolve Promise", async () => {
	const result: string = await Rhodium.resolve(
		Promise.resolve("value"),
	)
	assertStrictEquals(result, "value")
})

Deno.test("resolve Rhodium", async () => {
	const result: readonly [1, 2, 3] = await Rhodium.resolve(
		Rhodium.resolve([1, 2, 3]),
	)
	assertEquals(result, [1, 2, 3])
})
