import { assertEquals, assertRejects } from "jsr:@std/assert"
import { Rhodium } from "@/index.mts"

Deno.test("reject", () => {
	const { rhodium, reject } = Rhodium.withResolvers<"yes", "no">()
	const _rejectArg: "no" = "no" satisfies Parameters<typeof reject>[0]
	assertRejects(() => {
		reject("no")
		return rhodium
	})
})

Deno.test("resolve", async () => {
	const { rhodium, resolve } = Rhodium.withResolvers<"yes", "no">()
	const _resolveArg: "yes" = "yes" satisfies Parameters<typeof resolve>[0]
	resolve("yes")
	assertEquals(await rhodium, "yes")
})
