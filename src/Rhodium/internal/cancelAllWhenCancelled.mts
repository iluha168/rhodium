import type { Rhodium } from "../Rhodium.mts"

export function cancelAllWhenCancelled(
	dependants: Rhodium<any, any>[],
	{ signal }: { signal: AbortSignal },
) {
	for (const dependant of dependants) {
		signal.addEventListener("abort", () => dependant.cancel())
	}
}
