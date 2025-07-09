import { Rhodium } from "./index.mts"

export type RhodiumWithResolvers<R, E> = {
	rhodium: Rhodium<R, E>
	resolve: (value: R | PromiseLike<R> | Rhodium<R, E>) => void
	reject: (reason: E) => void
}

/**
 * Creates a new pending Rhodium.
 * @returns an object, containing the Rhodium along with its resolve and reject functions.
 */
export function withResolvers<R1, E1>(): NoInfer<
	RhodiumWithResolvers<R1, E1>
> {
	const resolvers = Promise.withResolvers<R1>()
	return {
		reject: resolvers.reject,
		resolve: resolvers.resolve,
		rhodium: new Rhodium<R1, E1>(resolvers.promise),
	} as RhodiumWithResolvers<R1, E1>
}
