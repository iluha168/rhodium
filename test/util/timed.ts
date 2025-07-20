import { Rhodium } from "@/index.mts"

export const timed = <C extends () => unknown>(callback: C) =>
	Rhodium
		.try(() => performance.now())
		.finally(callback)
		.then((begin) => performance.now() - begin)
