import { assertAlmostEquals, assertEquals } from "assert"
import type Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("all never reject", async () => {
	const result: [
		Rhodium.RhodiumSettledResult<"res1", never>,
		Rhodium.RhodiumSettledResult<"res2", never>,
	] = await Rhodium.allSettled([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
	])
	assertEquals(result, [{ status: "fulfilled", value: "res1" }, {
		status: "fulfilled",
		value: "res2",
	}])
})

Deno.test("one always rejects", async () => {
	const result: [
		Rhodium.RhodiumSettledResult<"res1", never>,
		Rhodium.RhodiumSettledResult<"res2", never>,
		Rhodium.RhodiumSettledResult<never, "err1">,
	] = await Rhodium.allSettled([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.reject("err1"),
	])
	assertEquals(result, [{ status: "fulfilled", value: "res1" }, {
		status: "fulfilled",
		value: "res2",
	}, { status: "rejected", reason: "err1" }])
})

Deno.test("one sometimes rejects", async () => {
	const result: [
		Rhodium.RhodiumSettledResult<"res1", never>,
		Rhodium.RhodiumSettledResult<"res2", never>,
		Rhodium.RhodiumSettledResult<"res3", "err1">,
	] = await Rhodium.allSettled([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rh<"res3", "err1">,
	])
	assertEquals(result, [{ status: "fulfilled", value: "res1" }, {
		status: "fulfilled",
		value: "res2",
	}, { status: "fulfilled", value: "res3" }])
})

Deno.test("all always reject", async () => {
	const result: [
		Rhodium.RhodiumSettledResult<never, "err2">,
		Rhodium.RhodiumSettledResult<never, "err1">,
	] = await Rhodium.allSettled([
		Rhodium.reject("err2"),
		Rhodium.reject("err1"),
	])
	assertEquals(result, [{ status: "rejected", reason: "err2" }, {
		status: "rejected",
		reason: "err1",
	}])
})

Deno.test("empty array", async () => {
	const result: [] = await Rhodium.allSettled([])
	assertEquals(result, [])
})

Deno.test("cancellable", async () => {
	let store = 0
	const rhodium = Rhodium.allSettled([
		Rhodium.sleep(1000).finally(() => store++),
		Rhodium.sleep(1000).finally(() => store++),
	]).finally(() => store++)
	await Rhodium.sleep(10)
	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 10)
	assertEquals(store, 3)
})

Deno.test("oneSettled resolved", async () => {
	const resolved = await Rhodium.oneSettled(Rhodium.resolve(1))
	assertEquals(resolved, { status: "fulfilled", value: 1 })
})

Deno.test("oneSettled rejected", async () => {
	const rejected = await Rhodium.oneSettled(Rhodium.reject(2))
	assertEquals(rejected, { status: "rejected", reason: 2 })
})

Deno.test("settled resolved", async () => {
	const resolved = await Rhodium.resolve(3).settled()
	assertEquals(resolved, { status: "fulfilled", value: 3 })
})

Deno.test("settled rejected", async () => {
	const rejected = await Rhodium.reject(4).settled()
	assertEquals(rejected, { status: "rejected", reason: 4 })
})
