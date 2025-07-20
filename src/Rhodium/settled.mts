import { Rhodium } from "./index.mts"
import { cancelAllWhenCancelled } from "./internal/cancelAllWhenCancelled.mts"
import type { Errored } from "./terminology.d.mts"

/**
 * The return type of a successfully settled {@link Rhodium}.
 */
export interface RhodiumFulfilledResult<R> extends PromiseFulfilledResult<R> {
	reason?: never
}

/**
 * The return type of a rejected settled {@link Rhodium}.
 */
export interface RhodiumRejectedResult<E> extends PromiseRejectedResult {
	value?: never
	reason: E
}

/**
 * The return type of any settled {@link Rhodium}.
 */
export type RhodiumSettledResult<R, E> =
	| RhodiumFulfilledResult<R>
	| RhodiumRejectedResult<E>

/**
 * Creates a Rhodium that is
 * resolved with an array of results when all of the provided values resolve or reject.
 */
export function allSettled<const Ps extends Rhodium<any, any>[] | []>(
	values: Ps,
): Rhodium<
	{
		-readonly [P in keyof Ps]: RhodiumSettledResult<
			Awaited<Ps[P]>,
			Errored<Ps[P]>
		>
	},
	never
> {
	const total = new Rhodium(Promise.allSettled(values))
	cancelAllWhenCancelled(values, total)
	return total as ReturnType<typeof Rhodium.allSettled<Ps>>
}
