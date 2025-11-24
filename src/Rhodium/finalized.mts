import { Rhodium } from "./index.mts"
import { cancelAllWhenCancelled } from "./internal/cancelAllWhenCancelled.mts"
import { Cancelled } from "./internal/cancellableCallback.mts"
import type { RhodiumSettledResult } from "./settled.mts"
import type { Errored } from "./terminology.d.mts"

/**
 * The return type of a cancelled finalized {@link Rhodium}.
 */
export interface RhodiumCancelledResult<E> {
	status: "cancelled"
	value?: never
	reason?: E
}

/**
 * The return type of any settled {@link Rhodium}.
 */
export type RhodiumFinalizedResult<R, E> =
	| RhodiumSettledResult<R, E>
	| RhodiumCancelledResult<E>

/**
 * Creates a Rhodium that is resolved when the provided value finalizes.
 * Finalization is a superset of both {@link Rhodium.cancel cancellation} and {@link oneSettled settlement}.
 * In case of cancellation, returned Rhodium will only resolve when all {@linkcode Rhodium.finally} callbacks have been executed.
 *
 * The returned Rhodium does not propagate cancellation upwards.
 */
export function oneFinalized<const R, const E>(
	rhodium: Rhodium<R, E>,
): Rhodium<RhodiumFinalizedResult<R, E>, never> {
	return new Rhodium(rhodium.promise
		.then(
			(data) =>
				rhodium.cancelled || data === Cancelled
					? { status: "cancelled" }
					: { status: "fulfilled", value: data },
			(err) => ({
				status: rhodium.cancelled ? "cancelled" : "rejected",
				reason: err,
			}),
		))
}

/**
 * Creates a Rhodium that is
 * resolved with an array of results when all of the provided values {@link oneFinalized finalize}.
 *
 * The returned Rhodium does not propagate cancellation upwards.
 */
export function allFinalized<const Ps extends Rhodium<any, any>[] | []>(
	values: Ps,
): Rhodium<
	{
		-readonly [P in keyof Ps]: RhodiumFinalizedResult<
			Awaited<Ps[P]>,
			Errored<Ps[P]>
		>
	},
	never
> {
	return new Rhodium<any, any>((resolve, _, signal) => {
		const finalizations: RhodiumFinalizedResult<any, any>[] = []
		if (!values.length) return resolve(finalizations)
		let totalFinalized = 0
		cancelAllWhenCancelled(
			values.map((rhodium, i) =>
				oneFinalized(rhodium).then((finalization) => {
					finalizations[i] = finalization
					if (++totalFinalized >= values.length) {
						resolve(finalizations)
					}
				})
			),
			{ signal },
		)
		signal.addEventListener("abort", resolve)
	}) as ReturnType<typeof allFinalized<Ps>>
}
