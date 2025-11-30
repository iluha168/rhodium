import { Rhodium } from "./Rhodium.mts"
import { reject } from "./reject.mts"
import { resolve } from "./resolve.mts"
import type { Errored, Merged } from "./terminology.mts"

/**
 * Resolves each Rhodium yielded by {@linkcode generator} one by one.
 * Allows writing asynchronous code imperatively: `for`, `if`, `while`, `switch`, `const`, `using` statements, etc.
 * Works similarly to `async` functions, except that `async` is written as `function*`, and `await` - as `yield*`.
 *
 * `try {} finally {}` will always execute its `finally` block, even in an event of cancellation.
 *
 * @returns a Rhodium that is fullfilled with the awaited return value of {@linkcode generator}, or
 * rejected when generator rejects.
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
): Merged<Rhodium<Awaited<R>, Errored<P> | Errored<R>>> {
	return new Rhodium((res, rej, signal) => {
		const queue = generator(...args, signal)

		/** Remember the currently executing Rhodium to be able to cancel it on command. */
		let pendingRh: Rhodium<any, any>

		/**
		 * Flag that tells us "we need to move into a `finally` block".
		 * After we moved there, the flag gets reset, to make sure all Rhodiums in `finally` get executed till the end.
		 */
		let wasRecentlyCancelled = false

		/**
		 * Internally, {@linkcode tryGen} is a Promise chain, which makes it not cancellable.
		 * This is necessary to reimplement proper cancellation, because the chain expands on demand, one Rhodium at a time
		 * (we cannot distinguish between `finally` callbacks inside the {@linkcode generator} - everything is a `then`).
		 */
		const deQueue = (
			op: "next" | "return" | "throw",
			previous?: any,
		): Promise<unknown> => {
			let done, value
			try {
				;({ done, value } = queue[op](previous as never))
			} catch (e) {
				done = true
				value = reject(e)
			}
			if (done) {
				// Reached the end of the generator - value becomes the return value of tryGen itself.
				pendingRh = resolve(value)
				return pendingRh.promise.then(res, rej)
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
					wasRecentlyCancelled = false
					return deQueue("throw", reason)
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
