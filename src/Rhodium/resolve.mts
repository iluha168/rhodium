import { Rhodium } from "./Rhodium.mts"
import type { Merged, ToRhodium } from "./terminology.mts"

/**
 * {@link ToRhodium Converts any value to a Rhodium}.
 * @param value Anything. {@linkcode PromiseLike}s and Rhodiums will be resolved.
 */
export function resolve<const P = void>(
	value?: P,
): Merged<ToRhodium<P>> {
	return (value instanceof Rhodium
		? value
		: new Rhodium(Promise.resolve(value))) as ReturnType<typeof resolve<P>>
}
