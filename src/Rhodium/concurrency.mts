import { Rhodium } from "./index.mts"
import type { Errored } from "./terminology.d.mts"

type ifNever<T, Y, N = never> = [never, T] extends [T, never] ? Y : N

type NeverIfOneElementIsNever<Arr> = "yes" extends {
	[Prop in keyof Arr]: ifNever<Arr[Prop], "yes">
}[keyof Arr & number] ? never
	: Arr

/**
 * Creates a Rhodium that is
 * resolved with an array of results when all of the provided values resolve, or
 * rejected when any {@linkcode PromiseLike} is rejected.
 */
export function all<const Ps extends Rhodium<any, any>[] | []>(
	values: Ps,
): NoInfer<
	Rhodium<
		NeverIfOneElementIsNever<
			{ -readonly [P in keyof Ps]: Awaited<Ps[P]> }
		>,
		Errored<Ps[keyof Ps]>
	>
> {
	return new Rhodium(Promise.all(values)) as ReturnType<typeof all<Ps>>
}

/**
 * Returns a Rhodium that is
 * resolved by the result of the first value to resolve, or
 * rejected with an array of rejection reasons if all of the given values are rejected.
 * It resolves all values of the passed array as it runs this algorithm.
 */
export function any<const Ps extends Rhodium<any, any>[] | []>(
	values: Ps,
): Rhodium<
	Awaited<Ps[number]>,
	NeverIfOneElementIsNever<
		{ -readonly [P in keyof Ps]: Errored<Ps[P]> }
	>
> {
	return new Rhodium(
		Promise.any(values).catch((e: AggregateError) => {
			throw e.errors
		}),
	) as ReturnType<typeof any<Ps>>
}

/**
 * Creates a Rhodium that is
 * resolved or rejected when any of the provided values are resolved or rejected.
 */
export function race<const Ps extends Rhodium<any, any>[] | []>(
	values: Ps,
): Rhodium<
	Awaited<Ps[number]>,
	Errored<Ps[keyof Ps]>
> {
	return new Rhodium(Promise.race(values)) as ReturnType<typeof race<Ps>>
}
