import { Rhodium } from "./index.mts"
import type { Merged, ToRhodium } from "./terminology.d.mts"

/**
 * {@link ToRhodium Converts any value to a Rhodium}.
 * @param value Anything. {@linkcode PromiseLike}s and Rhodiums will be resolved.
 */
export function resolve<const P = void>(
	value?: P,
): Merged<NoInfer<ToRhodium<P>>> {
	return new Rhodium(Promise.resolve(value)) as ReturnType<typeof resolve<P>>
}
