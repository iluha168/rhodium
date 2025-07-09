import { Rhodium } from "./index.mts"
import type { ToRhodium } from "./terminology.d.mts"

/**
 * {@link ToRhodium Converts any value to a Rhodium}.
 * @param value Anything. {@linkcode PromiseLike}s and Rhodiums will be resolved.
 */
export function resolve<const P = void>(value?: P): NoInfer<ToRhodium<P>> {
	return new Rhodium(Promise.resolve(value)) as ToRhodium<P>
}
