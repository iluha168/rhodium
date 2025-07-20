[![Build status](https://img.shields.io/github/actions/workflow/status/iluha168/rhodium/publish.yml)](https://github.com/iluha168/rhodium/actions/workflows/publish.yml)
[![JSR Version](https://img.shields.io/jsr/v/%40iluha168/rhodium)](https://jsr.io/@iluha168/rhodium)
[![NPM Version](https://img.shields.io/npm/v/rhodium)](https://www.npmjs.com/package/rhodium)
<!-- omit in toc -->
# Rhodium
A TypeScript `Promise` wrapper that adds syntax sugar and cancellation.
It has a type of `Rhodium<PossibleResolutions, PossibleRejections>`.

- [Interoperability with `Promise`](#interoperability-with-promise)
- [Features](#features)
  - [Error tracking](#error-tracking)
    - [The `Errored<T>` type](#the-erroredt-type)
  - [Cancellation](#cancellation)
    - [Limitations](#limitations)
    - [But what about multiple `then` calls on a single Rhodium?](#but-what-about-multiple-then-calls-on-a-single-rhodium)
    - [Return type of `cancel`](#return-type-of-cancel)
      - [Early cancellation](#early-cancellation)
  - [Additional methods \& syntax sugar](#additional-methods--syntax-sugar)
    - [`Rhodium.sleep`](#rhodiumsleep)
- [Inspired by](#inspired-by)


## Interoperability with `Promise`
- `Rhodium` **is awaitable** at runtime, and `Awaited<T>` can be used to await it in types.
- `Promise`, or any `PromiseLike`, **can be converted to `Rhodium`** by passing it to `Rhodium.resolve()` or `new Rhodium()`
- Is **convertable to `Promise`**. Simply get the **`promise` property** of a `Rhodium` instance.
> [!NOTE]
> Conversion to `Promise` loses [cancelability](#cancellation) and other `Rhodium`-exclusive [features](#features).

## Features
`Rhodium` implements all `Promise`'s static and non-static methods.

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
> This library assumes `throw` keyword is never used. **It is impossible to track types of `throw` errors.** `Rhodium` has a neverthrow philosophy; you should always use `Rhodium.reject()` instead. I suggest enforcing this rule if you decide to adopt `Rhodium`.

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

#### Return type of `cancel`
`cancel` returns a `Rhodium`, but it is actually **synchronous** at its core. Once `cancel` is run, its effects are immediate.

The returned `Rhodium` is **fullfilled** once the **currently running callback** and all of the following **`finally` callbacks** of the cancelled chain have been executed. Such new Rhodium is the beginning of a new chain.
> [!TIP]
> This could be useful, for example,
> - to show a loading throbber for the *exact* time the cancellation is in progress;
> - wait for handles to close before possibly opening them again;
> - suspense starting new chains, that use the same non-shareable resource, held by the cancelling chain;
> - etc.

In addition, [the described above limitation](#limitations) causes `cancel` to return a rejecting `Rhodium`, to preserve the [ease of handling errors](#error-tracking).

##### Early cancellation
> [!NOTE]
> The currently running callback might take a lot of time to execute! If the time it takes for the result of `cancel` to fullfill is important, then it might be of interest to optimize this time.
> 
> Every callback (except the non-cancellable `finally`) is provided an **`AbortSignal`** as the second argument, which is triggered when that callback has been running at the time of `cancel`. Using this signal is completely optional - it is only an optimization.

### Additional methods & syntax sugar
#### `Rhodium.sleep`
You no longer have to write the following boilerplate:
```ts
new Promise(resolve => setTimeout(resolve, milliseconds))
```
The same can now be written as `Rhodium.sleep(milliseconds)`, with the advantage of being [early cancellable](#early-cancellation).

## Inspired by
- [Effect.ts](https://effect.website/)
- [Bluebird](http://bluebirdjs.com/docs/api/cancellation.html)
