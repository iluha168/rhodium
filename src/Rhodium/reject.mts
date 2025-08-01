import { Rhodium } from "./index.mts"
import type { Merged } from "./terminology.d.mts"

/**
 * Creates a new rejected Rhodium for the provided reason.
 * @param reason The reason the Rhodium was rejected. Is never awaited.
 */
export function reject<const E1 = void>(
	reason?: E1,
): Merged<Rhodium<never, E1>> {
	return new Rhodium(Promise.reject(reason))
}
