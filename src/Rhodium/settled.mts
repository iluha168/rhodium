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
 * Creates a Rhodium that is resolved when the provided value resolves or rejects.
 * Syntax sugar for {@linkcode Rhodium.then}.
 */
export function oneSettled<const R, const E>(
	rhodium: Rhodium<R, E>,
): NoInfer<Rhodium<RhodiumSettledResult<R, E>, never>> {
	return rhodium.then(
		(value) => ({ status: "fulfilled" as const, value }),
		(reason) => ({ status: "rejected" as const, reason }),
	)
}

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
	return new Rhodium<any, any>((resolve, _, signal) => {
		const settlements: RhodiumSettledResult<any, any>[] = []
		if (!values.length) return resolve(settlements)
		let totalSettled = 0
		cancelAllWhenCancelled(
			values.map((rhodium, i) =>
				oneSettled(rhodium).then((settlement) => {
					settlements[i] = settlement
					if (++totalSettled >= values.length) resolve(settlements)
				})
			),
			{ signal },
		)
		signal.addEventListener("abort", resolve)
	}) as ReturnType<typeof allSettled<Ps>>
}
