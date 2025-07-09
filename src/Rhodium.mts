/**
 * @module
 * The definition of {@linkcode Rhodium}.
 */

type ifNever<T, THEN, ELSE = never> = [never, T] extends [T, never] ? THEN
	: ELSE

type NeverIfOneElementIsNever<Arr> = "yes" extends {
	[Prop in keyof Arr]: ifNever<Arr[Prop], "yes">
}[keyof Arr & number] ? never
	: Arr

type ToRhodium<T> = T extends Rhodium<any, any> ? T
	: T extends PromiseLike<infer R> ? Rhodium<Awaited<R>, unknown>
	: Rhodium<T, never>

/**
 * Similarly to {@linkcode Awaited<T>}, which returns the resolution type,
 * {@linkcode Errored<T>} returns the error type.
 */
export type Errored<T> = T extends Rhodium<any, infer E> ? E
	: T extends PromiseLike<any> ? unknown
	: never

export type RhodiumWithResolvers<R, E> = {
	rhodium: Rhodium<R, E>
	resolve: (value: R | PromiseLike<R> | Rhodium<R, E>) => void
	reject: (reason: E) => void
}

export type RhodiumFulfilledResult<R> = PromiseFulfilledResult<R>

export type RhodiumRejectedResult<E> =
	& Omit<PromiseRejectedResult, "reason">
	& { reason: E }

export type RhodiumSettledResult<R, E> =
	| RhodiumFulfilledResult<R>
	| RhodiumRejectedResult<E>

/**
 * A {@linkcode Promise} wrapper that adds syntax sugar.
 * `R` is the type of an {@link Awaited awaited} {@linkcode Rhodium}.
 * `E` is the {@link Errored error} which may be thrown by a {@linkcode Rhodium}.
 */
export class Rhodium<R, E> {
	/**
	 * Nested {@linkcode Promise} object this {@linkcode Rhodium} was created with.
	 */
	readonly promise: Promise<R>

	/**
	 * Is required to disable subtype reduction.
	 * Does not exist at runtime.
	 */
	declare private error?: E

	/**
	 * Creates a new {@linkcode Rhodium}.
	 * @param promise object to wrap.
	 */
	constructor(
		promise: PromiseLike<R>,
	)
	/**
	 * Creates a new {@linkcode Rhodium}.
	 * @param executor A callback used to initialize the rhodium.
	 * This callback is passed two arguments: a resolve callback used to resolve the rhodium with a value or the result of another {@link PromiseLike promise-like},
	 * and a reject callback used to reject the rhodium with a provided reason or error.
	 */
	constructor(
		executor: (
			resolve: (value: Rhodium<R, E>) => void,
			reject: (reason: E) => void,
		) => void,
	)
	constructor(
		arg:
			| ((
				resolve: (value: R | PromiseLike<R>) => void,
				reject: (reason: E) => void,
			) => void)
			| PromiseLike<R>,
	) {
		this.promise = typeof arg === "function"
			? new Promise(arg)
			: Promise.resolve(arg)
	}

	/**
	 * Creates a new resolved rhodium for the provided value.
	 * @param value Anything. {@linkcode PromiseLike}s and rhodiums will be resolved.
	 */
	static resolve<const P = void>(value?: P): NoInfer<ToRhodium<P>> {
		return new Rhodium(Promise.resolve(value)) as ToRhodium<P>
	}

	/**
	 * Creates a new rejected rhodium for the provided reason.
	 * @param reason The reason the rhodium was rejected. Is never awaited.
	 */
	static reject<const E1 = void>(
		reason?: E1,
	): NoInfer<Rhodium<never, E1>> {
		return new Rhodium(Promise.reject(reason))
	}

	/**
	 * Creates a Rhodium that is
	 * resolved with an array of results when all of the provided values resolve, or
	 * rejected when any {@linkcode PromiseLike} is rejected.
	 */
	static all<const Ps extends Rhodium<any, any>[] | []>(
		values: Ps,
	): NoInfer<
		Rhodium<
			NeverIfOneElementIsNever<
				{ -readonly [P in keyof Ps]: Awaited<Ps[P]> }
			>,
			Errored<Ps[keyof Ps]>
		>
	> {
		return new Rhodium(Promise.all(values)) as ReturnType<
			typeof Rhodium.all<Ps>
		>
	}

	/**
	 * Returns a Rhodium that is
	 * resolved by the result of the first value to resolve, or
	 * rejected with an array of rejection reasons if all of the given values are rejected.
	 * It resolves all values of the passed array as it runs this algorithm.
	 */
	static any<const Ps extends Rhodium<any, any>[] | []>(
		values: Ps,
	): Rhodium<
		Awaited<Ps[number]>,
		NeverIfOneElementIsNever<
			{ -readonly [P in keyof Ps]: Errored<Ps[P]> }
		>
	> {
		return new Rhodium(
			Promise.any(values).catch((e: AggregateError) => {
				throw e.errors
			}),
		) as ReturnType<typeof Rhodium.any<Ps>>
	}

	/**
	 * Creates a Rhodium that is
	 * resolved or rejected when any of the provided values are resolved or rejected.
	 */
	static race<const Ps extends Rhodium<any, any>[] | []>(
		values: Ps,
	): Rhodium<
		Awaited<Ps[number]>,
		Errored<Ps[keyof Ps]>
	> {
		return new Rhodium(Promise.race(values)) as ReturnType<
			typeof Rhodium.race<Ps>
		>
	}

	/**
	 * Creates a Rhodium that is
	 * resolved with an array of results when all of the provided values resolve or reject.
	 */
	static allSettled<const Ps extends Rhodium<any, any>[] | []>(
		values: Ps,
	): Rhodium<
		{
			-readonly [P in keyof Ps]: RhodiumSettledResult<
				Awaited<Ps[P]>,
				Errored<Ps[P]>
			>
		},
		never
	> {
		return new Rhodium(Promise.allSettled(values)) as ReturnType<
			typeof Rhodium.allSettled<Ps>
		>
	}

	/**
	 * Creates a new pending Rhodium.
	 * @returns an object, containing the rhodium along with its resolve and reject functions.
	 */
	static withResolvers<R1, E1>(): NoInfer<
		RhodiumWithResolvers<R1, E1>
	> {
		const resolvers = Promise.withResolvers<R1>()
		return {
			reject: resolvers.reject,
			resolve: resolvers.resolve,
			rhodium: new Rhodium<R1, E1>(resolvers.promise),
		} as RhodiumWithResolvers<R1, E1>
	}

	/**
	 * Takes a callback of any kind (returns or throws, synchronously or asynchronously) and wraps its result in a Rhodium.
	 * @param callbackFn A function that is called synchronously. It can do anything: either return a value, throw an error, or return a promise.
	 * @param args Additional arguments, that will be passed to the callback.
	 * @returns A Rhodium that is:
	 * - Already fulfilled, if the callback synchronously returns a value.
	 * - Already rejected, if the callback synchronously throws an error.
	 * - Asynchronously fulfilled or rejected, if the callback returns a {@link PromiseLike promise-like}.
	 */
	static try<
		const P,
		const U extends unknown[] = [],
	>(
		callbackFn: (...args: NoInfer<U>) => P,
		...args: U
	): NoInfer<ToRhodium<P>> {
		return new Rhodium(Promise.try(callbackFn, ...args)) as ToRhodium<P>
	}

	/**
	 * Attaches callbacks for the resolution and/or rejection of the Rhodium.
	 * @param onfulfilled The callback to execute when the Rhodium is resolved.
	 * @param onrejected The callback to execute when the Rhodium is rejected.
	 * @returns A Rhodium for the completion of which ever callback is executed.
	 */
	then<
		P1 = Rhodium<R, never>,
		P2 = Rhodium<never, E>,
	>(
		onfulfilled?:
			| ((value: NoInfer<R>) => P1)
			| null
			| undefined,
		onrejected?:
			| ((reason: NoInfer<E>) => P2)
			| null
			| undefined,
	): NoInfer<ToRhodium<P1 | P2>> {
		return new Rhodium(
			this.promise.then(onfulfilled, onrejected),
		) as ReturnType<
			typeof this.then<P1, P2>
		>
	}

	/**
	 * Attaches a callback for only the rejection of the Rhodium.
	 * @param onrejected The callback to execute when the Rhodium is rejected.
	 * @returns A Rhodium for the completion of the callback.
	 */
	catch<
		P1 = Rhodium<R, E>,
	>(
		onrejected?:
			| ((reason: NoInfer<E>) => P1)
			| null
			| undefined,
	): NoInfer<ToRhodium<P1> | Rhodium<R, never>> {
		return new Rhodium(
			this.promise.catch(onrejected),
		) as ReturnType<
			typeof this.catch<P1>
		>
	}

	/**
	 * Attaches a callback that is invoked when the Rhodium is settled (fulfilled or rejected).
	 * The resolved value cannot be modified from the callback.
	 * @param onfinally The callback to execute when the Rhodium is settled.
	 * @returns A Rhodium for the completion of the callback.
	 */
	finally(
		onfinally?: (() => void) | null | undefined,
	): NoInfer<Rhodium<R, E>> {
		return new Rhodium(this.promise.finally(onfinally))
	}

	[Symbol.toStringTag] = "Rhodium"
}
