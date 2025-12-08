import { assertAlmostEquals, assertEquals, assertRejects } from "assert"
import type Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("all never reject", async () => {
	const result: ["res1", "res2"] = await Rhodium.all([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, ["res1", "res2"])
})

Deno.test("one always rejects", () => {
	assertRejects(() => {
		const result: Rh<never, EvalError> = Rhodium.all([
			Rhodium.resolve("res1"),
			Rhodium.resolve("res2"),
			Rhodium.reject(new EvalError()),
		])
		return result.promise
	}, EvalError)
})

Deno.test("one sometimes rejects", async () => {
	const result: Rh<["res1", "res2", "res3"], "err1"> = Rhodium.all([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rh<"res3", "err1">,
	])
	assertEquals(await result, ["res1", "res2", "res3"])
})

Deno.test("all always reject", async () => {
	const createPromise = () => {
		const result: Rh<never, ["err1", "err2"]> = Rhodium.any([
			Rhodium.reject("err1"),
			Rhodium.reject("err2"),
		])
		return result.catch((errs) => errs)
	}
	assertEquals(await createPromise(), ["err1", "err2"])
})

Deno.test("empty array", async () => {
	const result: Rh<[], never> = Rhodium.all([])
	assertEquals(await result, [])
})

Deno.test("cancellable", async () => {
	let store = 0
	const rhodium = Rhodium.all([
		Rhodium.sleep(1000).finally(() => store++),
		Rhodium.sleep(1000).finally(() => store++),
	]).finally(() => store++)
	await Rhodium.sleep(10)
	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 10)
	assertEquals(store, 3)
})

Deno.test("cancels other Rhodiums on reject", async () => {
	const sleepLong = Rhodium.sleep(500)
	const sleepShort = Rhodium.sleep(50).then(Rhodium.reject)

	const actuallySleptLong = timed(() => sleepLong.finalized())
	const actuallySleptShort = timed(() => sleepShort.finalized())

	await assertRejects(() => Rhodium.all([sleepLong, sleepShort]).promise)
	assertAlmostEquals(await actuallySleptShort, 50, 5)
	assertAlmostEquals(await actuallySleptLong, 50, 5)
})

Deno.test("does not cancel other Rhodiums on resolve", async () => {
	const sleepLong = Rhodium.sleep(200)
	const sleepShort = Rhodium.sleep(50)

	const actuallySleptLong = timed(() => sleepLong.finalized())
	const actuallySleptShort = timed(() => sleepShort.finalized())

	await Rhodium.all([sleepLong, sleepShort])
	assertAlmostEquals(await actuallySleptShort, 50, 5)
	assertAlmostEquals(await actuallySleptLong, 200, 5)
})
