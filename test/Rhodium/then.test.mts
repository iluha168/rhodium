import { assertAlmostEquals, assertEquals } from "assert"
import type Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

/// NO CALLBACKS

Deno.test("does nothing with no args", async () => {
	const promise: Rh<"str", never> = Rhodium
		.resolve("str")
		.then()
		.then()
		.then()
	assertEquals(await promise, "str")
})

/// FIRST CALLBACK

Deno.test("returns a number", async () => {
	const promise: Rh<number, never> = Rhodium
		.resolve()
		.then(() => 5)
	assertEquals(await promise, 5)
})

Deno.test("returns a const number", async () => {
	const promise: Rh<5, never> = Rhodium
		.resolve()
		.then(() => 5 as const)
	assertEquals(await promise, 5)
})

Deno.test("returns a Promise", async () => {
	const promise: Rh<number, unknown> = Rhodium
		.resolve()
		.then(() => Promise.resolve(7))
	assertEquals(await promise, 7)
})

Deno.test("returns a Rhodium", async () => {
	const promise: Rh<8, never> = Rhodium
		.resolve()
		.then(() => Rhodium.resolve(8))
	assertEquals(await promise, 8)
})

Deno.test("infers callback argument", async () => {
	const promise = Rhodium
		.resolve("value")
		.then((arg) => {
			const check: "value" = arg
			return check
		})
	assertEquals(await promise, "value")
})

Deno.test("resolution signal", async () => {
	let store = 0
	const rhodium = Rhodium
		.resolve()
		.then((_, signal) => {
			assertEquals(signal.aborted, false)
			rhodium.cancel()
			assertEquals(signal.aborted, true)
			store = 1
		})
	await Rhodium.sleep(10)
	assertEquals(store, 1)
})

Deno.test("resolution is cancellable", async () => {
	const rhodium = Rhodium
		.resolve()
		.then(() => Rhodium.sleep(1000))

	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 10)
})

/// SECOND CALLBACK

Deno.test("handles with a number", async () => {
	const promise: Rh<number, never> = Rhodium
		.reject()
		.then(null, () => 5)
	assertEquals(await promise, 5)
})

Deno.test("handles with a const number", async () => {
	const promise: Rh<5, never> = Rhodium
		.reject()
		.then(null, () => 5 as const)
	assertEquals(await promise, 5)
})

Deno.test("handles with a Promise", async () => {
	const promise: Rh<number, unknown> = Rhodium
		.reject()
		.then(null, () => Promise.resolve(7))
	assertEquals(await promise, 7)
})

Deno.test("handles with a Rhodium", async () => {
	const promise: Rh<8, never> = Rhodium
		.reject()
		.then(null, () => Rhodium.resolve(8))
	assertEquals(await promise, 8)
})

Deno.test("infers handler argument", async () => {
	const promise = Rhodium
		.reject("err")
		.then(null, (arg) => {
			const check: "err" = arg
			return check
		})
	assertEquals(await promise, "err")
})

Deno.test("rejection signal", async () => {
	let store = 0
	const rhodium = Rhodium
		.reject()
		.then(null, (_, signal) => {
			assertEquals(signal.aborted, false)
			rhodium.cancel()
			assertEquals(signal.aborted, true)
			store = 1
		})
	await Rhodium.sleep(10)
	assertEquals(store, 1)
})

Deno.test("rejection is cancellable", async () => {
	const rhodium = Rhodium
		.reject()
		.then(null, () => Rhodium.sleep(1000))

	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 10)
})

/// BOTH CALLBACKS

Deno.test("outputs combine", async () => {
	const promise: Rh<number | string, never> = Rhodium
		.resolve()
		.then(() => 1, () => Rhodium.resolve(""))
	assertEquals(await promise, 1)
})

Deno.test("errors from first callback are not handled", async () => {
	const promise: Rh<"errAbove", "errHandler"> = Rhodium
		.reject("errAbove")
		.then(
			() => Rhodium.reject("errHandler"),
			(a: "errAbove") => Rhodium.resolve(a),
		)
	assertEquals(await promise, "errAbove")
})
