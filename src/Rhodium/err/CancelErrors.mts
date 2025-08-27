/** A generic error that is caused by some aspect of the cancellation feature. */
export abstract class CancelError extends Error {
	override name: string = CancelError.name
}

/** Rejected when a consumer is added to a cancelled Rhodium. */
export class CannotAttachConsumerError extends CancelError {
	override name: string = CannotAttachConsumerError.name
}

/** Rejected when a non-last Rhodium of its chain is attempted to be cancelled. */
export class CannotBeCancelledError extends CancelError {
	override name: string = CannotBeCancelledError.name
}
