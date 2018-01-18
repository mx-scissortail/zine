# API Documentation

Usage: `import * as zine from 'zine';` (or import functions individually)

---
### `issue(subject[, values])`

A common use case for zine's publisher is to assign some values to an object and then publish it. `issue` provides syntax sugar for this, and is equivalent to:
```
Object.assign(subject, values);
publish(subject, values);
```
Calling `issue` without a second argument is equivalent to just calling `publish`. Note that `issue` sends the provided `values` object as the second argument to `publish`, which can be useful when your subscriber is interested in what has changed. See the documentation for `publish` for more information.

---
### `publish(subject[, value])`

Publishes events associated with a given `subject`. If you've previously called `subscribe(subject, subscription)`, `publish(subject)` will trigger `subscription(subject)`, and `publish(subject, value)` will trigger `subscription(subject, value)`. Callbacks are triggered in the order of subscription.

The typical use here is to have some object that contains data, e.g.
```
let foo = {
  bar: true
};
```
Then if you mutate `foo` in some way (e.g. `foo.bar = false;`), you can call `publish(foo)` to notify any subscribers that depend on it to update. Having objects call `publish(this)` inside of methods is also fine.

Calling `publish(subject)` will trigger any subscriptions that were associated with `subject` at the time of that call to `publish`. If one of those subscriptions causes another to be added or removed (by calling `subscribe` or `unsubscribe`), that change won't affect what subscriptions are triggered by any currently executing calls to `publish`, but will affect all subsequent calls. This won't generally have any negative interactions with the lifecycle methods of subscriber components created by zine (for instance, unmounting subscriber components won't respond to further updates from zine, so `publish` won't trigger a re-render on an unmounting component).

---
### `publishable(subject)`

Returns `true` or `false` depending on whether `subject` is the kind of thing that we can attach subscriptions to. Currently, only objects and functions are accepted which means you can't subscribe to immutable values (like strings or numbers), but future versions may allow this. The current restriction owes to the use of `WeakMap` inside zine's pub/sub system.

The intended use of `publishable` is to gate calls to `subscribe`, e.g.
```
if (publishable(subject)) {
  subscribe(subject, subscription);
}
```
This is used to prevent `subscribe` from throwing an error if it's possible that `subject` might not be an object or function.

---
### `subscribe(subject, subscription)`

Registers the callback `subscription` to be called whenever `publish(subject)` or `publish(subject, value)` are called.
There are a few caveats worth noting. First, `subject` can only be an object or a function. `subscribe` will throw an error if this isn't the case. See `publishable` for more information. Second, `subscribe` makes no effort to ensure that `subscription` is a callable function. If you register something that isn't callable, the subscription will be registered but subsequent calls to `publish` will throw errors. Third, see the documentation for `publish` for a small caveat about the result of calling `subscribe` during a call to `publish`.

Internally, zine uses a `WeakMap` to track subscriptions, so it won't leak references (and therefore memory). If you `subscribe` to an object and then lose all other references to it (and thus the ability to call `publish` on it), it will be garbage collected along with its subscription list.

---
### `unsubscribe(subject, subscription)`

Removes all instances of `subscription` from the list of callbacks associated with `subject`. See the documentation for `publish` for a small caveat about the result of calling `unsubscribe` during a call to `publish`.

---
### `unsubscribeAll(subject)`

Removes all subscriptions associated with `subject`.
