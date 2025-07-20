import {
	assertAlmostEquals,
	assertEquals,
	assertRejects,
} from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"
import { timed } from "../util/timed.ts"

Deno.test("all never reject", async () => {
	const result: "res1" | "res2" = await Rhodium.any([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, "res1")
})

Deno.test("one always rejects", async () => {
	const result: Rhodium<"res1" | "res2", never> = Rhodium.any([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.reject(new EvalError()),
	])
	assertEquals(await result, "res1")
})

Deno.test("one sometimes rejects", async () => {
	const result: Rhodium<"res1" | "res2" | "res3", never> = Rhodium.any([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rhodium<"res3", "err1">,
	])
	assertEquals(await result, "res1")
})

Deno.test("all always reject", async () => {
	const createPromise = () => {
		const result: Rhodium<never, ["err1", "err2"]> = Rhodium.any([
			Rhodium.reject("err1"),
			Rhodium.reject("err2"),
		])
		return result.catch((errs) => errs)
	}
	assertEquals(await createPromise(), ["err1", "err2"])
})

Deno.test("empty array", () => {
	assertRejects(() => {
		const result: Rhodium<never, []> = Rhodium.any([])
		return result.promise
	})
})

Deno.test("cancellable", async () => {
	let store = 0
	const rhodium = Rhodium.any([
		Rhodium.sleep(1000).finally(() => store++),
		Rhodium.sleep(1000).finally(() => store++),
	]).finally(() => store++)
	await Rhodium.sleep(10)
	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 10)
	assertEquals(store, 3)
})
