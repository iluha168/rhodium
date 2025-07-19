/**
 * @module
 * The definition of {@linkcode Rhodium}.
 */

import type { Errored, Merged, ToRhodium } from "./terminology.d.mts"
import * as CancelErrors from "./CancelErrors.mts"
import * as concurrency from "./concurrency.mts"
import { withResolvers } from "./withResolvers.mts"
import { Try } from "./try.mts"
import { allSettled } from "./settled.mts"
import { resolve } from "./resolve.mts"
import { reject } from "./reject.mts"
import { sleep } from "./sleep.mts"

/**
 * A {@linkcode Promise} wrapper that adds syntax sugar.
 * `R` is the type of an {@link Awaited awaited} {@linkcode Rhodium}.
 * `E` is the {@link Errored error} which may be thrown by a {@linkcode Rhodium}.
 */
export class Rhodium<R, E> {
	/**
	 * Creates a new {@linkcode Rhodium}.
	 * @param promise object to wrap.
	 */
	constructor(
		promise: PromiseLike<R>,
	)
	/**
	 * Creates a new {@linkcode Rhodium}.
	 * @param executor A callback used to initialize the Rhodium.
	 * This callback is passed two arguments: a resolve callback used to resolve the Rhodium with a value or the result of another {@link PromiseLike promise-like},
	 * and a reject callback used to reject the Rhodium with a provided reason or error.
	 */
	constructor(
		executor: (
			resolve: (value: Rhodium<R, E>) => void,
			reject: (reason: E) => void,
		) => void,
	)
	constructor(
		arg:
			| ((
				resolve: (value: R | PromiseLike<R>) => void,
				reject: (reason: E) => void,
			) => void)
			| PromiseLike<R>,
	) {
		this.promise = typeof arg === "function"
			? new Promise(arg)
			: Promise.resolve(arg)
	}

	static readonly withResolvers = withResolvers
	static readonly resolve = resolve
	static readonly reject = reject

	static readonly all = concurrency.all
	static readonly any = concurrency.any
	static readonly race = concurrency.race
	static readonly allSettled = allSettled

	static readonly try = Try

	/**
	 * Attaches callbacks for the resolution and/or rejection of the Rhodium.
	 *
	 * **Throws {@linkcode CancelErrors.CannotAttachConsumerError} synchronously, when called on a cancelled Rhodium**.
	 * @param onfulfilled The callback to execute when the Rhodium is resolved.
	 * @param onrejected The callback to execute when the Rhodium is rejected.
	 * @returns A Rhodium for the completion of which ever callback is executed.
	 */
	then<
		P1 = Rhodium<R, never>,
		P2 = Rhodium<never, E>,
	>(
		onfulfilled?:
			| ((value: NoInfer<R>) => P1)
			| null
			| undefined,
		onrejected?:
			| ((reason: NoInfer<E>) => P2)
			| null
			| undefined,
	): Merged<NoInfer<ToRhodium<P1 | P2>>> {
		if (this.#childrenAmount === null) {
			throw new CancelErrors.CannotAttachConsumerError()
		}
		const child = new Rhodium(
			this.promise
				.finally(() => child.#parent = null)
				.then(
					onfulfilled &&
						((v) => this.cancelled || onfulfilled(v)),
					onrejected &&
						((e) => this.cancelled || onrejected(e)),
				).finally(() =>
					this.#childrenAmount !== null && this.#childrenAmount--
				),
		)
		child.#parent = this
		this.#childrenAmount++
		return child as ReturnType<typeof this.then<P1, P2>>
	}

	/**
	 * Attaches a callback for only the rejection of the Rhodium.
	 * Syntax sugar for {@linkcode then}.
	 * @param onrejected The callback to execute when the Rhodium is rejected.
	 * @returns A Rhodium for the completion of the callback.
	 */
	catch<
		P1 = Rhodium<R, E>,
	>(
		onrejected?:
			| ((reason: NoInfer<E>) => P1)
			| null
			| undefined,
	): Merged<NoInfer<ToRhodium<P1> | Rhodium<R, never>>> {
		return this.then(null, onrejected)
	}

	/**
	 * Attaches a callback that is invoked when the Rhodium is settled (fulfilled or rejected).
	 * The resolved value cannot be modified from the callback, but the rejected value can be.
	 * @param onfinally The callback to execute when the Rhodium is settled.
	 * @returns A Rhodium for the completion of the callback.
	 */
	finally<P1 = Rhodium<R, E>>(
		onfinally?: (() => P1) | null | undefined,
	): Merged<NoInfer<Rhodium<R, E | Errored<P1>>>> {
		const child = new Rhodium(
			this.promise
				.finally(() => child.#parent = null)
				.finally(onfinally),
		)
		child.#parent = this
		return child as ReturnType<typeof this.finally>
	}

	//                            ⬆️ Promise
	//                            ⬇️ Rhodium

	/**
	 * Nested {@linkcode Promise} object this {@linkcode Rhodium} was created with.
	 */
	readonly promise: Promise<R>

	/**
	 * Is required to disable subtype reduction.
	 * Does not exist at runtime.
	 */
	declare private error?: E

	/**
	 * Keep a reference to the parent {@linkcode Rhodium}.
	 * This is used for the upwards {@linkcode cancel} propagation.
	 */
	#parent: Rhodium<any, any> | null = null

	/**
	 * This value keeps track of the amount of pending consumers, except {@linkcode finally} - those should always be run.
	 * Propagate cancellation only if this value was 1 before the cancellation.
	 * Allow cancellation only if this value is 0.
	 * If this value is null, consumers will not be called - the Rhodium is {@linkcode cancelled}.
	 */
	#childrenAmount: number | null = 0

	static readonly sleep = sleep

	/** Returns whether this Rhodium was cancelled or not. */
	get cancelled(): boolean {
		return this.#childrenAmount === null
	}

	/**
	 * **Synchronous, even though it does return Rhodium.**
	 *
	 * Must be called on the last {@linkcode Rhodium} of its chain.
	 * Rejects {@linkcode CancelErrors.CannotBeCancelledError} otherwise.
	 *
	 * Cancels this Rhodium, and the preceding Rhodiums, up to the root *or* the point of divergence from another pending chain.
	 * Cancelled Rhodiums do not execute their consumers, except for {@linkcode finally}.
	 * @returns a Rhodium for the completion of all {@linkcode finally} in the chain.
	 */
	cancel(): Rhodium<void, CancelErrors.CannotBeCancelledError> {
		if (this.#childrenAmount !== null) {
			if (this.#childrenAmount > 0) {
				return Rhodium.reject(new CancelErrors.CannotBeCancelledError())
			}
			// `ancestor` is used to climb up the chain, with `this` as the starting point
			// deno-lint-ignore no-this-alias
			for (let ancestor: Rhodium<any, any> = this;;) {
				ancestor.#childrenAmount = null
				if (ancestor.#parent === null) break
				ancestor = ancestor.#parent
				// Ancestor must have non-null children amount - only the last Rhodium in a chain can be cancelled
				if (--ancestor.#childrenAmount! > 0) break
			}
		}
		return new Rhodium<void, never>(this.promise.then(() => {}, () => {}))
	}
}
