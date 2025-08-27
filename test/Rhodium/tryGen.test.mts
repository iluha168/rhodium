import {
	assertAlmostEquals,
	assertEquals,
	assertRejects,
} from "jsr:@std/assert"
import * as Rhodium from "@/mod.mts"
import { timed } from "../util/timed.ts"

Deno.test("yield* awaits", async () => {
	const three = await Rhodium.tryGen(function* () {
		const one = yield* Rhodium.resolve(1)
		const two = yield* Rhodium.resolve(2)
		return one + two
	})
	assertEquals(three, 3)
})

Deno.test("return awaits", async () => {
	const three = await Rhodium.tryGen(function* () {
		const one = yield* Rhodium.resolve(1)
		const two: 2 = yield* Rhodium.resolve(2)
		return Rhodium.resolve(one + two)
	})
	assertEquals(three, 3)
})

Deno.test("try {} catch {} does nothing", async () => {
	const zero = await Rhodium.tryGen(function* () {
		try {
			yield* Rhodium.reject(0)
			return 1
		} catch {
			return 2
		}
	}).catch((zero) => zero)
	assertEquals(zero, 0)
})

Deno.test("try {} finally {} is called in resolution", async () => {
	const elapsed = await timed(() =>
		Rhodium.tryGen(function* () {
			try {
				return yield* Rhodium.resolve()
			} finally {
				yield* Rhodium.sleep(200)
			}
		})
	)
	assertAlmostEquals(elapsed, 200, 15)
})

Deno.test("try {} finally {} is called in rejection", async () => {
	let didReject = false
	const elapsed = await timed(() =>
		Rhodium.tryGen(function* () {
			try {
				return yield* Rhodium.reject()
			} finally {
				yield* Rhodium.sleep(200)
			}
		}).catch(() => didReject = true)
	)
	assertAlmostEquals(elapsed, 200, 15)
	assertEquals(didReject, true)
})

Deno.test("try {} finally {} is called in cancellation", async () => {
	let store = 0
	const rhodium = Rhodium
		.tryGen(function* () {
			try {
				yield* Rhodium.sleep(200)
				yield* Rhodium.sleep(200).then(() => Rhodium.reject())
			} finally {
				yield* Rhodium.sleep(50)
				yield* Rhodium.sleep(50)
				store = 1
			}
			yield* Rhodium.sleep(5000)
		}).then(() => Rhodium.sleep(200))

	await Rhodium.sleep(250)

	assertAlmostEquals(await timed(() => rhodium.cancel()), 100, 15)
	assertEquals(store, 1)
})

Deno.test("cancellable 1", async () => {
	const rhodium = Rhodium
		.tryGen(function* () {
			yield* Rhodium.sleep(100)
			yield* Rhodium.sleep(100)
		}).then(() => Rhodium.sleep(100))

	await Rhodium.sleep(50)

	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 15)
})

Deno.test("cancellable 2", async () => {
	const rhodium = Rhodium
		.tryGen(function* () {
			yield* Rhodium.sleep(100)
			yield* Rhodium.sleep(100)
		}).then(() => Rhodium.sleep(100))

	await Rhodium.sleep(150)

	assertAlmostEquals(await timed(() => rhodium.cancel()), 0, 15)
})

Deno.test("for", async () => {
	const rhodium = Rhodium
		.tryGen(function* (n) {
			for (let i = 0; i < n; i++) {
				yield* Rhodium.sleep(20)
			}
		}, 10)

	assertAlmostEquals(await timed(() => rhodium), 200, 15)
})

Deno.test("nested generators", async () => {
	function* sleep100() {
		yield* Rhodium.sleep(50)
		yield* Rhodium.sleep(50)
		return yield* Rhodium.resolve(1)
	}

	function* main() {
		let number = 0
		number += yield* sleep100()
		number += yield* sleep100()
		return number
	}

	const rhodium = Rhodium.tryGen(main)

	assertAlmostEquals(await timed(() => rhodium), 200, 15)
	assertEquals(await rhodium, 2)
})

Deno.test("try {} finally {} can replace rejection reason", () => {
	assertRejects(() =>
		Rhodium.tryGen(function* () {
			try {
				yield* Rhodium.reject(new SyntaxError())
			} finally {
				yield* Rhodium.reject(new TypeError())
			}
		}).promise, TypeError)
})
