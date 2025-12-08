import type { Rhodium } from "../Rhodium.mts"
import { withResolvers } from "../withResolvers.mts"
import { Cancelled } from "./cancellableCallback.mts"

export function consumeMany<IR, IE, OR, OE>(
	dependencies: readonly Rhodium<IR, IE>[],
	eachResolve: (resolve: (data: OR) => void, index: number, data: IR) => void,
	eachReject: (reject: (error: OE) => void, index: number, error: IE) => void,
) {
	const { reject, resolve, signal, rhodium } = withResolvers<OR, OE>()

	// Once this Rhodium is settled, none of the dependencies will affect it anymore
	// Therefore, all dependencies can be cancelled for optimization.
	const resolveAndCancelAll = (data: OR) => {
		cancelAll()
		resolve(data)
	}
	const rejectAndCancelAll = (error: OE) => {
		cancelAll()
		reject(error)
	}

	const wrappedDeps = dependencies.map((rhodium, i) =>
		rhodium.then(
			eachResolve.bind(null, resolveAndCancelAll, i),
			eachReject.bind(null, rejectAndCancelAll, i),
		)
	)

	function cancelAll() {
		for (const dependency of wrappedDeps) {
			dependency.cancel()
		}
	}
	signal.addEventListener(
		"abort",
		resolveAndCancelAll.bind(null, Cancelled as never),
	)

	return rhodium
}
