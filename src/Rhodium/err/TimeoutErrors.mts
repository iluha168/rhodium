/**
 * Rejected when a `Rhodium` with a time constraint has not resolved in time.
 */
export class TimeoutError extends Error {
	override name: string = TimeoutError.name
}
