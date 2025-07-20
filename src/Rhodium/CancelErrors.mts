/** A generic error that is caused by some aspect of the cancellation feature. */
export abstract class CancelError extends Error {
	name = CancelError.name
}

/** Rejected when a consumer is added to a cancelled Rhodium. */
export class CannotAttachConsumerError extends CancelError {
	name = CannotAttachConsumerError.name
}

/** Rejected when a non-last Rhodium of its chain is attempted to be cancelled. */
export class CannotBeCancelledError extends CancelError {
	name = CannotBeCancelledError.name
}
