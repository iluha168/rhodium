[![License](https://img.shields.io/github/license/iluha168/rhodium)](https://github.com/iluha168/rhodium)
[![Build status](https://img.shields.io/github/actions/workflow/status/iluha168/rhodium/publish.yml)](https://github.com/iluha168/rhodium/actions/workflows/publish.yml)
[![JSR Version](https://img.shields.io/jsr/v/%40iluha168/rhodium)](https://jsr.io/@iluha168/rhodium)
[![NPM Version](https://img.shields.io/npm/v/rhodium)](https://www.npmjs.com/package/rhodium)
[![NPM Downloads](https://img.shields.io/npm/d18m/rhodium?style=flat&label=npm%20downloads)](https://www.npmjs.com/package/rhodium?activeTab=versions)
<!-- omit in toc -->
# Rhodium
## About
`Rhodium` is a TypeScript-first `Promise` alternative with error tracking, cancellation, common async utilities, and a sprinkle of syntax sugar.

It uses native `Promise` internally, allowing for minimal performance loss.

`Rhodium` implements all `Promise`'s static and non-static methods, making them cancellable and error-tracking as well.

```ts
import * as Rh from "rhodium" // Static methods
import Rhodium from "rhodium" // Class
```

## Table of contents

- [About](#about)
- [Table of contents](#table-of-contents)
- [Interoperability with `Promise`](#interoperability-with-promise)
- [Features](#features)
  - [Error tracking](#error-tracking)
    - [The `Errored<T>` type](#the-erroredt-type)
  - [Cancellation](#cancellation)
    - [Limitations](#limitations)
    - [But what about multiple `then` calls on a single Rhodium?](#but-what-about-multiple-then-calls-on-a-single-rhodium)
  - [Finalization](#finalization)
    - [`Rhodium.oneFinalized`](#rhodiumonefinalized)
    - [Early cancellation](#early-cancellation)
  - [Additional methods \& syntax sugar](#additional-methods--syntax-sugar)
    - [`Rhodium.sleep`](#rhodiumsleep)
    - [`Rhodium.oneSettled`](#rhodiumonesettled)
    - [`Rhodium.tryGen` - the `async` of Rhodium](#rhodiumtrygen---the-async-of-rhodium)
    - [`Rhodium.catchFilter`](#rhodiumcatchfilter)
- [Inspired by](#inspired-by)

## Interoperability with `Promise`
- `Rhodium` **is awaitable** at runtime, and `Awaited<T>` can be used to await it in types.
- `Promise`, or any `PromiseLike`, **can be converted to `Rhodium`** by passing it to `Rhodium.resolve()` or `new Rhodium()`
- Is **convertable to `Promise`**. Simply get the **`promise` property** of a `Rhodium` instance.
> [!NOTE]
> Conversion to `Promise` loses [cancelability](#cancellation) and other `Rhodium`-exclusive [features](#features).

## Features
### Error tracking
Rhodium keeps track of all errors a `Rhodium` chain may reject with, if used correctly.
```ts
Rhodium
  .try(
    chance => chance > 0.5
      ? "success"
      : Rhodium.reject("error"),
    Math.random(),
  )
  .then(data => data /* <? "success" */)
  .catch(e => e /* <? "error" */ )
  .then(data => data /* <? "success" | "error" */)
```

> [!CAUTION]
> This library assumes `throw` keyword is never used. **It is impossible to track types of `throw` errors.** `Rhodium` has a neverthrow philosophy; you must always use `Rhodium.reject()` instead. I suggest enforcing this rule if you decide to adopt `Rhodium`.


> [!CAUTION]
> All errors must be structurally distinct:
> - ❌ `new SyntaxError` ≈ `new TypeError`
> - ✔️ `class ErrA { code = 1 as const }` ≉ `class ErrB { code = 2 as const }`
>
> This is a TypeScript limitation. Any object containing another triggers a subtype reduction. Usually this object would be constructed by `Rhodium.reject()`, but this does work for everything, e.g., arrays:
> ```ts
> class ErrorA extends Error {}
> class ErrorB extends Error {}
>    // ▼? const result: ErrorA[]
> const result = Math.random() > 0.5
>   ? [new ErrorA()]
>   : [new ErrorB()]
> ```

> [!IMPORTANT]
> Other **`PromiseLike`** objects returned inside the chain automatically change the **error type to `unknown`**. We can never be sure what type they reject, if any. This includes **`async` callbacks**, as they always return `Promise`s.

#### The `Errored<T>` type
Similarly to `Awaited<T>`, which returns the resolution type,
`Errored<T>` returns the error type.
```ts
const promise = Promise.reject()
type E = Errored<typeof promise>
//   ^? unknown
```
```ts
const promise = Rhodium.resolve()
type E = Errored<typeof promise>
//   ^? never
```
```ts
const promise = Rhodium.reject()
type E = Errored<typeof promise>
//   ^? void
```
```ts
const promise = Rhodium.reject(new TypeError())
type E = Errored<typeof promise>
//   ^? TypeError
```

### Cancellation
Cancellation prevents any further callbacks from running.
> [!IMPORTANT]
> `finally` is completely unaffected by the cancellation feature. This callback will always execute, and it can be attached to a cancelled `Rhodium`.

Here is an example:
```ts
const myRhodium = Rhodium
    .try(() => console.log(1))
    .then(() => Rhodium.sleep(1000))
    .then(() => console.log(2))
    .finally(() => console.log(3))
```
This should print `1`, `2` and `3`, right? And it does!

However, if we append this line:
```ts
setTimeout(() => myRhodium.cancel(), 500)
```
...then suddenly only `1` and `3` are printed. Invocation of `cancel` has prevented the second `console.log`!

> [!IMPORTANT]
> - `cancel` [returns a `Rhodium`](#rhodiumonefinalized), but it is actually **synchronous** at its core. Once `cancel` is run, its effects are immediate.
> - If `Rhodium` rejects right before cancellation, the reason might get supressed. If `Rhodium` rejects during cancellation, the reason gets caught into [the returned value](#rhodiumonefinalized).

In addition, [the described below limitation](#limitations) causes `cancel` to return a rejecting `Rhodium`, to preserve the [ease of handling errors](#error-tracking).

#### Limitations

> [!WARNING]
> - Only the last `Rhodium` in a given chain can be cancelled. Cancelling in the middle is not allowed.
> - It is impossible to attach a new callback to a cancelled `Rhodium`, because no callbacks would run off of it. This situation **throws synchronously**, as deemed unintentional by the programmer. A check using `cancelled` property is possible, if that is the intended behaviour.

#### But what about multiple `then` calls on a single Rhodium?
A `Rhodium` or a `Promise` chain is not really a chain - it is a tree. What happens to the other branches when one gets cut off?

In that case, a branch gets cancelled all the way up until it meets another branch. Suppose you have a following tree of `Rhodium`s:
```
A -> B -> C -> D
       \> E -> F -> G
```
Only `D` and `G` would be cancellable, because they are at the ends of their chains. There are 3 possibilities to consider:
- When `D` gets cancelled, so does `C`.
- When `G` gets cancelled, so do `F` and then `E`.
- **Only when both** `D` and `G` get cancelled, no matter the order, do `B` and `A` get cancelled as well.

### Finalization
#### `Rhodium.oneFinalized`
*Also known as the resolution value of `cancel`.*
Has a non-static shorthand called `Rhodium.finalized`.

The returned `Rhodium` is **resolved** once
- `this` `Rhodium` had [settled](#rhodiumonesettled), or
- the **currently running callback** and all of the following **`finally` callbacks** of the cancelled chain had been executed.

```ts
Rhodium
  .sleep(100)
  .cancel()
  .then(finalizationResult => /* == { status: "cancelled" } */)
     // ^? RhodiumFinalizedResult<void, never>
```

> [!TIP]
> Awaiting finalization could be useful, for example, to
> - show a loading throbber for the *exact* time the cancellation is in progress;
> - wait for handles to close before possibly opening them again;
> - suspense starting new chains, that use the same non-shareable resource, held by the cancelling chain;
> - check for supressed errors, which one might want to rethrow;
> - etc.

> [!NOTE]
> The returned `Rhodium` is the beginning of a new chain. It is detached from the input `Rhodium`, and will not propagate cancellation to it.

#### Early cancellation

On `cancel`, the currently running callback will not be stopped, and it will delay finalization. If the time it takes for a Rhodium to finalize is important, then it might be of interest to optimize this time.

Every callback, attached by `then`, `catch`, etc. (except the non-cancellable `finally`) is provided an **`AbortSignal`** as the second argument, which is triggered when that callback has been running at the time of `cancel`. On signal, the callback should resolve as soon as possible.

Using this signal is completely optional - it is only an optimization.

### Additional methods & syntax sugar
#### `Rhodium.sleep`
You no longer have to write the following boilerplate:
```ts
new Promise(resolve => setTimeout(resolve, milliseconds))
```
The same can now be written as `Rhodium.sleep(milliseconds)`, with the advantage of being [early cancellable](#early-cancellation).

#### `Rhodium.oneSettled`
Same as `Promise.allSettled()`; except the rejection reason is properly typed, and it is applied to one `Rhodium` instead of an array.
Has a non-static shorthand called `Rhodium.settled`.

A settled `Rhodium` can be safely `await`ed! You will not lose the error type, because it makes its way into the resolution type.
However, `async` functions still have rejection type `unknown`, and cannot be cancelled - for that reason use [`Rhodium.tryGen`](#rhodiumtrygen---the-async-of-rhodium).

```ts
const myRhodium: Rhodium<"value", Error> = /* ... */
const { value, reason, status } = await myRhodium.settled()
      // ^? value: "value" | undefined
      //    reason: Error | undefined
      //    status: "fulfilled" | "rejected"
if (value) {
	console.log(value, reason, status)
            // ^? value: "value"
            //    reason: undefined
            //    status: "fulfilled"
} else {
	console.log(value, reason, status)
            // ^? value: undefined
            //    reason: Error
            //    status: "rejected"
}
```

#### `Rhodium.tryGen` - the `async` of Rhodium
Executes a generator function, that is now able to type-safely `await` Rhodiums, by `yield*`-ing them instead. When a yielded `Rhodium` resolves, the generator is resumed with that resolution value.

The return value of the generator becomes the resolution value of `tryGen`.

> [!CAUTION]
> The generator function is free to
> - never exit;
> - use any JavaScript constructs such as `while`, `for`, `switch`, `if`, etc.;
> - `yield*` other such generators, including itself;
>
> **but it cannot utilize `try {} catch {}`**. The `catch` block will never be executed, as a part of [the neverthrow philosophy](#error-tracking). Any unhandled rejection will move the generator's execution to the `finally` block, if there is one, and after it completes, `tryGen` will reject.

```ts
Rhodium.tryGen(function* () {
  for (let i = 1; i <= 10; i++) {
    const { value: items, reason } = yield* fetchItems(i).settled()
    if (items) {
      console.log(`Page ${i}: ${items}`)
    } else {
      console.error(reason)
    }
    yield* Rhodium.sleep(1000)
  }
})
```

#### `Rhodium.catchFilter`
With the power of type guards, handling specific errors becomes easy. The first argument is a filter for specific errors, and the second is the callback, which gets called with only the allowed errors. Filtered out errors get rejected again, unaffected, essentially "skipping" `catchFilter`.
```ts
const myRhodium: Rhodium<Data, ErrorA | ErrorB> = /* ... */
myRhodium.catchFilter(
  err => err instanceof ErrorA,
  (err /* : ErrorA */) => "handled ErrorA" as const
) // <? Rhodium<Data | "handled ErrorA", ErrorB>
```

## Inspired by
- [Effect.ts](https://effect.website/)
- [Bluebird](http://bluebirdjs.com/docs/api/cancellation.html)
- [Neverthrow](https://www.npmjs.com/package/neverthrow)
