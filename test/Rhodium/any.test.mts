import { assertAlmostEquals, assertEquals, assertRejects } from "@std/assert"
import type Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("all never reject", async () => {
	const result: "res1" | "res2" = await Rhodium.any([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, "res1")
})

Deno.test("one always rejects", async () => {
	const result: Rh<"res1" | "res2", never> = Rhodium.any([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.reject(new EvalError()),
	])
	assertEquals(await result, "res1")
})

Deno.test("one sometimes rejects", async () => {
	const result: Rh<"res1" | "res2" | "res3", never> = Rhodium.any([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rh<"res3", "err1">,
	])
	assertEquals(await result, "res1")
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

Deno.test("empty array", () => {
	assertRejects(() => {
		const result: Rh<never, []> = Rhodium.any([])
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

Deno.test("does not cancel other Rhodiums on reject", async () => {
	const sleepLong = Rhodium.sleep(200)
	const sleepShort = Rhodium.sleep(50).then(Rhodium.reject)

	const actuallySleptLong = timed(() => sleepLong.finalized())
	const actuallySleptShort = timed(() => sleepShort.finalized())

	await Rhodium.any([sleepLong, sleepShort])
	assertAlmostEquals(await actuallySleptShort, 50, 5)
	assertAlmostEquals(await actuallySleptLong, 200, 5)
})

Deno.test("cancels other Rhodiums on resolve", async () => {
	const sleepLong = Rhodium.sleep(200)
	const sleepShort = Rhodium.sleep(50)

	const actuallySleptLong = timed(() => sleepLong.finalized())
	const actuallySleptShort = timed(() => sleepShort.finalized())

	await Rhodium.any([sleepLong, sleepShort])
	assertAlmostEquals(await actuallySleptShort, 50, 5)
	assertAlmostEquals(await actuallySleptLong, 50, 5)
})
