import {
	assertAlmostEquals,
	assertEquals,
	assertRejects,
	assertThrows,
} from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"
import {
	CannotAttachConsumerError,
	CannotBeCancelledError,
} from "@/CancelErrors.mts"
import { timed } from "../util/timed.ts"

Deno.test("cancel mid-chain", () => {
	assertRejects(() => {
		const midChain = Rhodium
			.resolve()
			.then(() => 1)
		midChain
			.then(() => 2)
		return midChain.cancel().promise
	}, CannotBeCancelledError)
})

Deno.test("attach callback to a cancelled Rhodium", () => {
	const { rhodium } = Rhodium.withResolvers()
	rhodium.cancel()
	assertThrows(() => rhodium.then(), CannotAttachConsumerError)
	assertThrows(() => rhodium.catch(), CannotAttachConsumerError)
	rhodium.finally()
})

Deno.test("callbacks are not executed", async () => {
	let store = 0
	await Rhodium
		.sleep(500)
		.then(() => store = 1)
		.cancel()
	assertEquals(store, 0)

	await Rhodium
		.reject()
		.catch(() => store = 1)
		.cancel()
	assertEquals(store, 0)
})

Deno.test("finally is executed", async () => {
	let store = 0
	await Rhodium
		.sleep(500)
		.finally(() => store = 1)
		.cancel()
	assertEquals(store, 1)
})

Deno.test("cancels only one branch", () => {
	const root = Rhodium.resolve()
	assertEquals(root.cancelled, false)

	const branch1 = root.then(() => +0).then(() => 1)
	const branch2 = root.then(() => -0).then(() => 2)
	assertEquals(branch1.cancelled, false)
	assertEquals(branch2.cancelled, false)

	branch1.cancel()
	assertEquals(root.cancelled, false)
	assertEquals(branch1.cancelled, true)
	assertEquals(branch2.cancelled, false)

	branch2.cancel()
	assertEquals(root.cancelled, true)
	assertEquals(branch1.cancelled, true)
	assertEquals(branch2.cancelled, true)
})

Deno.test("recursive", async () => {
	const rhodium = Rhodium
		.try(() =>
			Rhodium
				.try(() =>
					Rhodium
						.try(() => Rhodium.sleep(1000))
						.finally(() => Rhodium.sleep(100))
				)
				.then(() => Rhodium.sleep(1000))
				.finally(() => Rhodium.sleep(100))
		)
		.then(() => Rhodium.sleep(1000))
		.finally(() => Rhodium.sleep(100))
	await Rhodium.sleep(50)
	const elapsed = await timed(() => rhodium.cancel())
	assertAlmostEquals(elapsed, 300, 15)
})
