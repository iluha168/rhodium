import {
	assertAlmostEquals,
	assertEquals,
	assertRejects,
} from "jsr:@std/assert"
import type Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("all never reject", async () => {
	const result: "res1" | "res2" = await Rhodium.race([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, "res1")
})

Deno.test("one always rejects", () => {
	assertRejects(() => {
		const result: Rh<"res1" | "res2", EvalError> = Rhodium.race([
			Rhodium.reject(new EvalError()),
			Rhodium.resolve("res1"),
			Rhodium.resolve("res2"),
		])
		return result.promise
	}, EvalError)
})

Deno.test("one sometimes rejects", async () => {
	const result: Rh<"res1" | "res2" | "res3", "err1"> = Rhodium.race([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rh<"res3", "err1">,
	])
	assertEquals(await result, "res1")
})

Deno.test("all always reject", async () => {
	const createPromise = () => {
		const result: Rh<never, "err1" | "err2"> = Rhodium.race([
			Rhodium.reject("err2"),
			Rhodium.reject("err1"),
		])
		return result.catch((errs) => errs)
	}
	assertEquals(await createPromise(), "err2")
})

Deno.test("empty array", () => {
	assertRejects(() => {
		const result: Rh<never, never> = Rhodium.race([])
		return result.promise
	})
})

Deno.test("cancellable", async () => {
	let store = 0
	const rhodium = Rhodium.race([
		Rhodium.sleep(1000).finally(() => store++),
		Rhodium.sleep(1000).finally(() => store++),
	]).finally(() => store++)
	await Rhodium.sleep(10)
	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 10)
	assertEquals(store, 3)
})
