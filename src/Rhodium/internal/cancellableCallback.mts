import { Rhodium } from "../index.mts"

export function cancellableCallback<D extends any[], P>(
	callback:
		| ((...args: [...D, signal: AbortSignal]) => P)
		| null
		| undefined,
	/** Can only be called inside the returned callback, not synchronously */
	getChild: () => Rhodium<any, any>,
	parent: Rhodium<any, any>,
):
	| NoInfer<(...value: D) => P | void>
	| null
	| undefined {
	return callback && ((...data) => {
		if (parent.cancelled) return
		const signal = getChild().signal
		const result = callback(...data, signal)
		if (result instanceof Rhodium) {
			// Callbacks recursively unwrap Promises and Rhodiums
			// In the case of Rhodiums, we have to recursively cancel as well
			signal.addEventListener("abort", () => result.cancel())
		}
		return result
	})
}
