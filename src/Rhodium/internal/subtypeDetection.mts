/**
 * Check if two types are assignable to each other.
 * For `Rhodium`, this means either
 * - `A extends (B | ..)`
 * - `B extends (A | ..)`
 */
export type isSameSoft<A, B, Yes, No> = [A, B] extends [B, A] ? Yes : No

/** Check if two types are exactly the same. */
export type isSameHard<A, B, Yes, No> =
	// deno-fmt-ignore
	(<T>() => T extends A ? 0 : 1) extends
	(<T>() => T extends B ? 0 : 1) ? Yes : No

/**
 * Checks whether B is a subtype reduction of A:
 * mutually assignable, but not exactly same.
 */
export type doesReduceTo<A, B, Yes, No> = isSameHard<
	A,
	B,
	No,
	isSameSoft<A, B, Yes, No>
>

/**
 * Check whether {@linkcode Exclude Excluding}
 * type {@linkcode By} from type {@linkcode T}
 * cannot be reversed.
 */
export type isExcludeUnsafe<T, By, Yes, No> = isSameHard<
	Exclude<T, Exclude<T, By>>,
	By,
	No, // Inverted logic!
	Yes // If same, then `By` is a good filter
>
