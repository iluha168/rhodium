import { assertEquals } from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"
import type { RhodiumSettledResult } from "@/settled.mts"

Deno.test("all never reject", async () => {
	const result: [
		RhodiumSettledResult<"res1", never>,
		RhodiumSettledResult<"res2", never>,
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
		RhodiumSettledResult<"res1", never>,
		RhodiumSettledResult<"res2", never>,
		RhodiumSettledResult<never, "err1">,
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
		RhodiumSettledResult<"res1", never>,
		RhodiumSettledResult<"res2", never>,
		RhodiumSettledResult<"res3", "err1">,
	] = await Rhodium.allSettled([
		Rhodium.resolve("res1"),
		Rhodium.resolve("res2"),
		Rhodium.resolve("res3") as Rhodium<"res3", "err1">,
	])
	assertEquals(result, [{ status: "fulfilled", value: "res1" }, {
		status: "fulfilled",
		value: "res2",
	}, { status: "fulfilled", value: "res3" }])
})

Deno.test("all always reject", async () => {
	const result: [
		RhodiumSettledResult<never, "err2">,
		RhodiumSettledResult<never, "err1">,
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
