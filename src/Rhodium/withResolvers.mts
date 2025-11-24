import { Rhodium } from "./Rhodium.mts"

export type RhodiumWithResolvers<R, E> = {
	rhodium: Rhodium<R, E>
	resolve: (value: R | Rhodium<R, E>) => void
	reject: (reason: E) => void
	signal: AbortSignal
}

/**
 * Creates a new pending Rhodium.
 * @returns an object, containing the Rhodium along with its resolve and reject functions.
 */
export function withResolvers<R1, E1>(): RhodiumWithResolvers<R1, E1> {
	const resolvers: Partial<RhodiumWithResolvers<R1, E1>> = {}
	resolvers.rhodium = new Rhodium<R1, E1>((res, rej, signal) => {
		resolvers.resolve = res
		resolvers.reject = rej
		resolvers.signal = signal
	})
	return resolvers as RhodiumWithResolvers<R1, E1>
}
