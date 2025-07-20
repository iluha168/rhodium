import { assertAlmostEquals, assertEquals } from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"

Deno.test("does nothing with no args", async () => {
	const promise: Rhodium<"str", never> = Rhodium
		.resolve("str")
		.finally()
		.finally()
		.finally()
		.finally()
	assertEquals(await promise, "str")
})

Deno.test("does not affect return type", async () => {
	const promise: Rhodium<number, never> = Rhodium
		.resolve()
		.then(() => 5)
		.finally(() => "str")
	assertEquals(await promise, 5)
})

Deno.test("is called in a rejection", async () => {
	let modifyMe = 0
	const promise: Rhodium<string, never> = Rhodium
		.reject()
		.finally(() => modifyMe = 1)
		.catch(() => "caught!")
	assertEquals(modifyMe, 0)
	assertEquals(await promise, "caught!")
	assertEquals(modifyMe, 1)
})

Deno.test("is awaited", async () => {
	const ms = 200
	const promise: Rhodium<number, never> = Rhodium
		.resolve(8)
		.then(() => performance.now())
		.finally(() => Rhodium.sleep(ms))
		.then((begin) => performance.now() - begin)
	assertAlmostEquals(await promise, ms, 15)
})

Deno.test("can add to the rejection", async () => {
	const reason = await Rhodium
		.resolve()
		.finally(() => Rhodium.reject(2))
		.catch((e: 2) => e)
	assertEquals(reason, 2)
})
