import { assertAlmostEquals, assertEquals } from "@std/assert"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("empty array", async () => {
	const result: [] = await Rhodium.allFinalized([])
	assertEquals(result, [])
})

Deno.test("allFinalized does not cancel upwards", async () => {
	let store = 0
	const rhSleep = Rhodium.sleep(100).finally(() => store++)
	const rhodium = Rhodium.allFinalized([rhSleep, rhSleep]).finally(() =>
		store++
	)
	await Rhodium.sleep(10)

	assertEquals(store, 0)
	assertEquals(rhSleep.cancelled, false)

	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 5)

	assertEquals(store, 1)
	assertEquals(rhSleep.cancelled, false)

	await rhSleep
	assertEquals(store, 2)
})

Deno.test("oneFinalized resolved", async () => {
	const resolved = await Rhodium.oneFinalized(Rhodium.resolve(1))
	assertEquals(resolved, { status: "fulfilled", value: 1 })
})

Deno.test("oneFinalized rejected", async () => {
	const rejected = await Rhodium.oneFinalized(Rhodium.reject(2))
	assertEquals(rejected, { status: "rejected", reason: 2 })
})

Deno.test("oneFinalized cancelled", async () => {
	const rhodium = Rhodium.sleep(100)
		.finally(() => Rhodium.sleep(100))

	Rhodium.sleep(50).then(() => rhodium.cancel())
	const rhodiumFinalizeDuration = timed(() => Rhodium.oneFinalized(rhodium))

	assertEquals(await Rhodium.oneFinalized(rhodium), { status: "cancelled" })

	assertAlmostEquals(await rhodiumFinalizeDuration, (100 + 100) - 50, 10)
})

Deno.test("finalised resolved", async () => {
	const resolved = await Rhodium.resolve(1).finalized()
	assertEquals(resolved, { status: "fulfilled", value: 1 })
})

Deno.test("finalised rejected", async () => {
	const rejected = await Rhodium.reject(2).finalized()
	assertEquals(rejected, { status: "rejected", reason: 2 })
})

Deno.test("finalised cancelled", async () => {
	const rhodium = Rhodium.sleep(100)
		.finally(() => Rhodium.sleep(100))

	Rhodium.sleep(50).then(() => rhodium.cancel())
	const rhodiumFinalizeDuration = timed(() => rhodium.finalized())

	assertEquals(await rhodium.finalized(), { status: "cancelled" })

	assertAlmostEquals(await rhodiumFinalizeDuration, (100 + 100) - 50, 10)
})

Deno.test("allFinalized", async () => {
	const rhodium = Rhodium.sleep(100)
		.finally(() => Rhodium.sleep(100))

	Rhodium.sleep(50).then(() => rhodium.cancel())
	const rhodiumFinalizeDuration = timed(() => Rhodium.allFinalized([rhodium]))

	assertEquals(
		await Rhodium.allFinalized([
			rhodium,
			Rhodium.resolve(3),
			Rhodium.reject(4),
		]),
		[
			{ status: "cancelled" },
			{ status: "fulfilled", value: 3 },
			{ status: "rejected", reason: 4 },
		],
	)

	assertAlmostEquals(await rhodiumFinalizeDuration, (100 + 100) - 50, 10)
})

Deno.test("cancellation rejected", async () => {
	assertEquals(
		await Rhodium
			.resolve(0)
			.finally(() => Rhodium.reject(3))
			.cancel(),
		{ status: "cancelled", reason: 3 },
	)

	assertEquals(
		await Rhodium
			.reject(4)
			.cancel(),
		{ status: "cancelled", reason: 4 },
	)
})

Deno.test("does not cancel other Rhodiums on reject", async () => {
	const sleepLong = Rhodium.sleep(200)
	const sleepShort = Rhodium.sleep(50).then(Rhodium.reject)

	const actuallySleptLong = timed(() => sleepLong.finalized())
	const actuallySleptShort = timed(() => sleepShort.finalized())

	await Rhodium.allFinalized([sleepLong, sleepShort])
	assertAlmostEquals(await actuallySleptShort, 50, 20)
	assertAlmostEquals(await actuallySleptLong, 200, 20)
})

Deno.test("does not cancel other Rhodiums on resolve", async () => {
	const sleepLong = Rhodium.sleep(200)
	const sleepShort = Rhodium.sleep(50)

	const actuallySleptLong = timed(() => sleepLong.finalized())
	const actuallySleptShort = timed(() => sleepShort.finalized())

	await Rhodium.allFinalized([sleepLong, sleepShort])
	assertAlmostEquals(await actuallySleptShort, 50, 20)
	assertAlmostEquals(await actuallySleptLong, 200, 20)
})
