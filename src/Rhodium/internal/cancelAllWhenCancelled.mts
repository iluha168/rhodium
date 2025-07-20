import type { Rhodium } from "../index.mts"

export function cancelAllWhenCancelled(
	dependants: Rhodium<any, any>[],
	{ signal }: { signal: AbortSignal },
) {
	for (const dependant of dependants) {
		signal.addEventListener("abort", () => dependant.cancel())
	}
}
