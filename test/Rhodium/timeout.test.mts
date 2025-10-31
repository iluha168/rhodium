import Rh from "@/mod.mts"
import * as Rhodium from "@/mod.mts"
import { assertAlmostEquals, assertEquals, assertRejects } from "assert"

Deno.test("no timeout, synchronous", async () => {
	await Rhodium
		.resolve()
		.timeout(0)
})

Deno.test("timeout, asynchronous", async () => {
	await assertRejects(
		() =>
			Rhodium
				.sleep(10)
				.timeout(0)
				.promise,
		Rhodium.err.TimeoutError,
	)
})

Deno.test("no timeout, asynchronous", async () => {
	await Rhodium
		.sleep(1)
		.timeout(10)
})

Deno.test("cancellable", async () => {
	const rhodium = Rhodium
		.sleep(100)
		.timeout(1000)

	const begin = performance.now()
	const cancellationResult = await rhodium.cancel()
	assertAlmostEquals(performance.now() - begin, 0, 5)

	assertEquals(cancellationResult, { status: "cancelled" })
})

Deno.test("cancels base on timeout", async () => {
	let gotSignal = false
	assertEquals(gotSignal, false)
	const begin = performance.now()

	await assertRejects(
		() =>
			new Rh<void, never>(
				(_, __, signal) => {
					signal.addEventListener("abort", () => {
						gotSignal = true
					})
				},
			)
				.timeout(100)
				.then(() => "callback")
				.promise,
		Rhodium.err.TimeoutError,
	)

	assertAlmostEquals(performance.now() - begin, 100, 5)
	assertEquals(gotSignal, true)
})

Deno.test("parallel timeouts", async () => {
	const sleepRh = Rhodium.sleep(10000)
	await Promise.all([
		assertRejects(
			() => sleepRh.timeout(10).promise,
			Rhodium.err.TimeoutError,
		),
		assertRejects(
			() => sleepRh.timeout(20).promise,
			Rhodium.err.TimeoutError,
		),
		assertRejects(
			() => sleepRh.timeout(30).promise,
			Rhodium.err.TimeoutError,
		),
	])
})
