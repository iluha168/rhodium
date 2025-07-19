/**
 * @module
 * The definition of {@linkcode Rhodium}.
 */

import type { Merged, ToRhodium } from "./terminology.d.mts"
import * as concurrency from "./concurrency.mts"
import { withResolvers } from "./withResolvers.mts"
import { Try } from "./try.mts"
import { allSettled } from "./settled.mts"
import { resolve } from "./resolve.mts"
import { reject } from "./reject.mts"

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
		return new Rhodium(
			this.promise.then(onfulfilled, onrejected),
		) as ReturnType<
			typeof this.then<P1, P2>
		>
	}

	/**
	 * Attaches a callback for only the rejection of the Rhodium.
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
		return new Rhodium(
			this.promise.catch(onrejected),
		) as ReturnType<
			typeof this.catch<P1>
		>
	}

	/**
	 * Attaches a callback that is invoked when the Rhodium is settled (fulfilled or rejected).
	 * The resolved value cannot be modified from the callback.
	 * @param onfinally The callback to execute when the Rhodium is settled.
	 * @returns A Rhodium for the completion of the callback.
	 */
	finally(
		onfinally?: (() => void) | null | undefined,
	): Merged<NoInfer<Rhodium<R, E>>> {
		return new Rhodium(this.promise.finally(onfinally))
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
}
