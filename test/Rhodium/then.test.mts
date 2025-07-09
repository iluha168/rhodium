import { assertEquals } from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"

/// NO CALLBACKS

Deno.test("does nothing with no args", async () => {
	const promise: Rhodium<"str", never> = Rhodium
		.resolve("str")
		.then()
		.then()
		.then()
	assertEquals(await promise, "str")
})

/// FIRST CALLBACK

Deno.test("returns a number", async () => {
	const promise: Rhodium<number, never> = Rhodium
		.resolve()
		.then(() => 5)
	assertEquals(await promise, 5)
})

Deno.test("returns a const number", async () => {
	const promise: Rhodium<5, never> = Rhodium
		.resolve()
		.then(() => 5 as const)
	assertEquals(await promise, 5)
})

Deno.test("returns a Promise", async () => {
	const promise: Rhodium<number, unknown> = Rhodium
		.resolve()
		.then(() => Promise.resolve(7))
	assertEquals(await promise, 7)
})

Deno.test("returns a Rhodium", async () => {
	const promise: Rhodium<8, never> = Rhodium
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

/// SECOND CALLBACK

Deno.test("handles with a number", async () => {
	const promise: Rhodium<number, never> = Rhodium
		.reject()
		.then(null, () => 5)
	assertEquals(await promise, 5)
})

Deno.test("handles with a const number", async () => {
	const promise: Rhodium<5, never> = Rhodium
		.reject()
		.then(null, () => 5 as const)
	assertEquals(await promise, 5)
})

Deno.test("handles with a Promise", async () => {
	const promise: Rhodium<number, unknown> = Rhodium
		.reject()
		.then(null, () => Promise.resolve(7))
	assertEquals(await promise, 7)
})

Deno.test("handles with a Rhodium", async () => {
	const promise: Rhodium<8, never> = Rhodium
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

/// BOTH CALLBACKS

Deno.test("outputs combine", async () => {
	const promise: Rhodium<number | string, never> = Rhodium
		.resolve()
		.then(() => 1, () => Rhodium.resolve(""))
	assertEquals(await promise, 1)
})

Deno.test("errors from first callback are not handled", async () => {
	const promise: Rhodium<"errAbove", "errHandler"> = Rhodium
		.reject("errAbove")
		.then(
			() => Rhodium.reject("errHandler"),
			(a: "errAbove") => Rhodium.resolve(a),
		)
	assertEquals(await promise, "errAbove")
})
