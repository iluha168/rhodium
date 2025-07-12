import type { Rhodium } from "./index.mts"

/**
 * The same as the return type of {@linkcode Rhodium.resolve}:
 * - A synchronous value becomes a Rhodium of {@link Errored error type} `never`
 * - A {@link PromiseLike promise-like} value becomes a Rhodium of {@link Errored error type} `unknown`
 * - A {@link Rhodium} stays the same
 */
export type ToRhodium<T> = T extends Rhodium<any, any> ? T
	: T extends PromiseLike<infer R> ? Rhodium<Awaited<R>, unknown>
	: Rhodium<T, never>

/**
 * Similarly to {@linkcode Awaited<T>}, which returns the resolution type,
 * {@linkcode Errored<T>} returns the error type.
 */
export type Errored<T> = T extends Rhodium<any, infer E> ? E
	: T extends PromiseLike<any> ? unknown
	: never

/**
 * Merges a union of {@link Rhodium Rhodiums} into a single type.
 * @example ```
 * type M = Merged<Rhodium<1, never> | Rhodium<never, 2>>
 * //   ^? M: Rhodium<1, 2>
 * ```
 */
export type Merged<P extends Rhodium<any, any>> = [P] extends
	[Rhodium<infer R, infer E>] ? Rhodium<R, E> : never
