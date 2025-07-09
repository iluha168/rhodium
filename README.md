<!-- omit in toc -->
# Rhodium
A TypeScript `Promise` wrapper that adds syntax sugar.
It has a type of `Rhodium<PossibleResolutions, PossibleErrors>`.

- [Interoperability with `Promise`](#interoperability-with-promise)
- [Features](#features)
  - [Error tracking](#error-tracking)
    - [Caveats](#caveats)
    - [The `Errored<T>` type](#the-erroredt-type)


## Interoperability with `Promise`
- `Rhodium` **is awaitable** at runtime, and `Awaited<T>` can be used to await it in types.
- `Promise`, or any `PromiseLike`, **can be converted to `Rhodium`** by passing it to `Rhodium.resolve()` or `new Rhodium()`
- Is **convertable to `Promise`**. Simply get the **`promise` property** of a `Rhodium` instance.

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

#### Caveats
- Assumes `throw` keyword is never used. **It is impossible to track `throw` errors.** `Rhodium` has a neverthrow philosophy, use `Rhodium.reject()` instead. I suggest enforcing this rule if you decide to adopt `Rhodium`.
- Other **`PromiseLike`** objects returned inside the chain automatically change the **error type to `unknown`**. We can never be sure what type they reject, if any.
- **`async` callbacks** lose type information by `await`ing. Therefore, they also **cause the error type to become `unknown`**.

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
