import { Rhodium } from "../index.mts"

export const Cancelled: unique symbol = Symbol()

export function cancellableCallback<D extends unknown, P>(
	callback:
		| ((...args: [D, signal: AbortSignal]) => P)
		| null
		| undefined,
	/** Can only be called inside the returned callback, not synchronously */
	child: Rhodium<any, any>,
	parent: Rhodium<any, any>,
):
	| NoInfer<(value: D | typeof Cancelled) => P | typeof Cancelled>
	| null
	| undefined {
	return callback && ((data) => {
		if (parent.cancelled || data === Cancelled) return Cancelled
		const { signal } = child
		const result = callback(data, signal)
		if (result instanceof Rhodium) {
			// Callbacks recursively unwrap Promises and Rhodiums
			// In the case of Rhodiums, we have to recursively cancel as well
			signal.addEventListener("abort", () => result.cancel())
		}
		return result
	})
}
