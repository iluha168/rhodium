import { Rhodium } from "./index.mts"
import type { Errored } from "./terminology.d.mts"

/**
 * Resolves each Rhodium yielded by {@linkcode generator} one by one.
 * Allows writing asynchronous code imperatively: `for`, `if`, `while`, `switch`, `const`, `let` statements, etc.
 * Works similarly to `async` functions, except that `async` is written as `function*`, and `await` - as `yield*`.
 *
 * To ensure type-safety, **`try {} catch {}` will not catch errors**. Rejections will always be propagated down the chain.
 * Use the error handling tools provided by Rhodium, such as `catch`
 *
 * However, `try {} finally {}` will always execute its `finally` block, even in an event of cancellation.
 *
 * @returns a Rhodium that is fullfilled with the awaited return value of {@linkcode generator}, or
 * rejected when any yielded Rhodium rejects.
 * @example
 * ```
 * Rhodium.tryGen(function* () {
 * 	// yield* awaits a Rhodium
 * 	const connection = yield* openConnection()
 * 	try {
 * 		yield* connection.send("ping")
 * 		// Control of flow is easy
 * 		if (yield* connection.read() !== "pong") {
 * 			// This is how `throw` is written 😅
 * 			return yield* Rhodium.reject(new ExpectedPongError())
 * 		}
 * 	} finally {
 * 		// This will always execute, even in cancellation
 * 		yield* connection.close()
 * 	}
 * })
 * ```
 */
export function tryGen<
	const P extends Rhodium<any, any>,
	const R,
	const U extends unknown[] = [],
>(
	generator: (...args: [...U, signal: AbortSignal]) => Generator<P, R, never>,
	...args: U
): Rhodium<Awaited<R>, Errored<P | R>> {
	return new Rhodium((res, rej, signal) => {
		const queue = generator(...args, signal)

		/** Remember the currently executing Rhodium to be able to cancel it on command. */
		let pendingRh: Rhodium<any, any>

		/**
		 * Flag that tells us "we need to move into a `finally` block".
		 * After we moved there, the flag gets reset, to make sure all Rhodiums in `finally` get executed till the end.
		 */
		let wasRecentlyCancelled = false

		let lastRejection: null | { reason: any } = null

		/**
		 * Internally, {@linkcode tryGen} is a Promise chain, which makes it not cancellable.
		 * This is necessary to reimplement proper cancellation, because the chain expands on demand, one Rhodium at a time
		 * (we cannot distinguish between `finally` callbacks inside the {@linkcode generator} - everything is a `then`).
		 */
		const deQueue = (
			op: "next" | "return",
			previous?: any,
		): Promise<unknown> => {
			const { done, value } = queue[op](previous as never)
			if (done) {
				// Reached the end of the generator - value becomes the return value of tryGen itself.
				pendingRh = Rhodium.resolve(value)
				return pendingRh.promise.then(
					(value) =>
						lastRejection ? rej(lastRejection.reason) : res(value),
					rej,
				)
			}
			pendingRh = value as P
			return pendingRh.promise.then(
				(value) => {
					// On cancellation, make sure to go to `finally` block and continue draining generator
					const link = deQueue(
						wasRecentlyCancelled ? "return" : "next",
						value,
					)
					wasRecentlyCancelled = false
					return link
				},
				(reason) => {
					lastRejection = { reason }
					return deQueue("return", reason)
				},
			)
		}
		deQueue("next")

		signal.addEventListener("abort", () => {
			wasRecentlyCancelled = true
			pendingRh.cancel()
		})
	})
}
