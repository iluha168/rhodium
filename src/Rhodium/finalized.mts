import { Rhodium } from "./Rhodium.mts"
import { Cancelled } from "./internal/cancellableCallback.mts"
import { consumeMany } from "./internal/consumeMany.mts"
import { resolve } from "./resolve.mts"
import type { RhodiumSettledResult } from "./settled.mts"
import type { Errored } from "./terminology.mts"

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
 * Finalization is a superset of both {@link Rhodium.cancel cancellation} and {@link RhodiumSettledResult settlement}.
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

type AllFinalized<Ps extends readonly Rhodium<any, any>[]> = {
	-readonly [P in keyof Ps]: RhodiumFinalizedResult<
		Awaited<Ps[P]>,
		Errored<Ps[P]>
	>
}

/**
 * Creates a Rhodium that is
 * resolved with an array of results when all of the provided values {@link oneFinalized finalize}.
 *
 * The returned Rhodium does not propagate cancellation upwards.
 */
export function allFinalized<const Ps extends readonly Rhodium<any, any>[]>(
	values: Ps,
): Rhodium<AllFinalized<Ps>, never> {
	const finalizations = [] as AllFinalized<Ps>
	if (!values.length) {
		return resolve(finalizations) as ReturnType<typeof allFinalized<Ps>>
	}
	let totalFinalized = 0
	return consumeMany(
		values.map(oneFinalized),
		(resolve, i, finalization) => {
			finalizations[i] = finalization
			if (++totalFinalized >= values.length) {
				resolve(finalizations)
			}
		},
		// This will never be called because oneFinalized never rejects
		// deno-coverage-ignore
		() => 0,
	)
}
