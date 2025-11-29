import { Rhodium } from "./Rhodium.mts"
import type { Merged } from "./terminology.mts"

/**
 * Creates a new rejected Rhodium for the provided reason.
 * @param reason The reason the Rhodium was rejected. Is never awaited.
 */
export function reject<const E1 = void>(
	reason?: E1,
): Merged<Rhodium<never, E1>> {
	return new Rhodium<never, E1>(Promise.reject(reason))
}
