import { Rhodium } from "./index.mts"

/**
 * Creates a Rhodium that will be resolved in {@linkcode ms} milliseconds.
 */
export function sleep(ms: number): Rhodium<void, never> {
	return new Rhodium((resolve) => {
		setTimeout(resolve, ms)
	})
}
