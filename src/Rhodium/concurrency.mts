import type { Rhodium } from "./Rhodium.mts"
import { consumeMany } from "./internal/consumeMany.mts"
import { resolve } from "./resolve.mts"
import type { Errored } from "./terminology.mts"

type ifNever<T, Y, N = never> = [never, T] extends [T, never] ? Y : N

type NeverIfOneElementIsNever<Arr> = "yes" extends {
	[Prop in keyof Arr]: ifNever<Arr[Prop], "yes">
}[keyof Arr & number] ? never
	: Arr

type AllAwaited<Ps extends readonly Rhodium<any, any>[]> =
	NeverIfOneElementIsNever<
		{
			-readonly [P in keyof Ps]: Awaited<Ps[P]>
		}
	>

/**
 * Creates a Rhodium that is
 * resolved with an array of results when all of the provided values resolve, or
 * rejected when any {@linkcode PromiseLike} is rejected.
 */
export function all<const Ps extends readonly Rhodium<any, any>[]>(
	values: Ps,
): Rhodium<AllAwaited<Ps>, Errored<Ps[keyof Ps]>> {
	const resolutions = [] as unknown as AllAwaited<Ps>
	if (!values.length) {
		return resolve(resolutions) as ReturnType<typeof all<Ps>>
	}
	let totalRes = 0
	return consumeMany(
		values,
		(resolve, i, val) => {
			resolutions[i] = val
			if (++totalRes >= values.length) resolve(resolutions)
		},
		(reject, _, error) => reject(error),
	)
}

type AllErrored<Ps extends readonly Rhodium<any, any>[]> =
	NeverIfOneElementIsNever<
		{ -readonly [P in keyof Ps]: Errored<Ps[P]> }
	>

/**
 * Returns a Rhodium that is
 * resolved by the result of the first value to resolve, or
 * rejected with an array of rejection reasons if all of the given values are rejected.
 */
export function any<const Ps extends readonly Rhodium<any, any>[]>(
	values: Ps,
): Rhodium<Awaited<Ps[number]>, AllErrored<Ps>> {
	const rejections = [] as unknown as AllErrored<Ps>
	let totalRej = 0
	return consumeMany(
		values,
		(resolve, _, data) => resolve(data),
		(reject, i, err) => {
			rejections[i] = err
			if (++totalRej >= values.length) reject(rejections)
		},
	)
}

/**
 * Creates a Rhodium that is
 * resolved or rejected when any of the provided values are resolved or rejected.
 */
export function race<const Ps extends readonly Rhodium<any, any>[]>(
	values: Ps,
): Rhodium<Awaited<Ps[number]>, Errored<Ps[keyof Ps]>> {
	return consumeMany(
		values,
		(resolve, _, data) => resolve(data),
		(reject, _, error) => reject(error),
	)
}
