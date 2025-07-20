import {
	assertAlmostEquals,
	assertEquals,
	assertStrictEquals,
} from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"
import { timed } from "../util/timed.ts"

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

Deno.test("cancellable", async () => {
	let elapsed = await timed(() =>
		Rhodium.resolve(Rhodium.resolve(Rhodium.sleep(300)))
	)
	assertAlmostEquals(elapsed, 300, 10)

	elapsed = await timed(() =>
		Rhodium.resolve(Rhodium.resolve(Rhodium.sleep(300))).cancel()
	)
	assertAlmostEquals(elapsed, 0, 10)
})
