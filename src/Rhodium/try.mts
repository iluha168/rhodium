import { Rhodium } from "./Rhodium.mts"
import type { Merged, ToRhodium } from "./terminology.mts"

/**
 * Takes a callback of any kind (returns or throws, synchronously or asynchronously) and wraps its result in a Rhodium.
 * @param callbackFn A function that is called synchronously. It can do anything: either return a value, throw an error, or return a promise.
 * @param args Additional arguments, that will be passed to the callback.
 * @returns A Rhodium that is:
 * - Already fulfilled, if the callback synchronously returns a value.
 * - Already rejected, if the callback synchronously throws an error.
 * - Asynchronously fulfilled or rejected, if the callback returns a {@link PromiseLike promise-like}.
 */
export function Try<
	const P,
	const U extends unknown[] = [],
>(
	callbackFn: (...args: [...U, signal: AbortSignal]) => P,
	...args: U
): Merged<ToRhodium<P>> {
	return new Rhodium((resolve, reject, signal) => {
		try {
			resolve(callbackFn(...args, signal))
		} catch (e) {
			reject(e)
		}
	}) as ReturnType<typeof Try<P, U>>
}
