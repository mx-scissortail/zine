# API Documentation

## `zine` (publisher/subscriber core module)

Usage: `import * as zine from 'zine';` (or import functions individually)

The base `zine` module contains the publisher/subscriber core functionality and exports five functions: `issue`, `publish`, `publishable`, `subscribe` and `unsubscribe`. The `zine` module does not have any React dependencies and can be used independently.

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

Publishes events associated with a given `subject`. If you've previously called `subscribe(subject, subscription)`, `publish(subject)` will trigger `subscription()`, and `publish(subject, value)` will trigger `subscription(value)`. Callbacks are triggered in the order of subscription.

The typical use here is to have some object that contains data, e.g.
```
var foo = {
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
## zine/Connect (React integration module)

Usage: `import {Connect, connector} from 'zine/Connect';`

The `zine/Connect` module contains all the React-related functionality provided by zine. It exports the React wrapper component `Connect` and a syntax sugar function `connector`, as well as all of the above functions (for convenience).

---
### `Connect`

`Connect` is a react wrapper component. It takes three props: `source` (any publishable subject, i.e. an object or function), `render` (a function of two arguments that determines what `Connect` renders) and `passProps` (an optional object of additional props to pass along at render time). The `source` argument is passed along as the first argument to the `render` prop whenever `Connect` renders. So for instance:

```
<Connect source={StoreInstance} passProps={{foo: 'bar'}} render={(store, props) => (
  <SomeOtherComponent {...props} value={store.value} />
  )} />
```

Will render `<SomeOtherComponent foo='bar' value={StoreInstance.value} />`. The useful feature of `Connect` is that it automatically manages a subscription to whatever is provided to its `source` prop and re-renders whenever that is published. So the above component will re-render (in place, without affecting the rest of the component hierarchy) whenever `StoreInstance` is published from anywhere in the application, which makes it easy to inject state updates anywhere in the component hierarchy.

If `Connect` unmounts or is re-rendered from above with a new `source` prop, it will automatically cancel its former subscription (and create a new one if necessary).

---
### `connector(source, render)`

`connector` provides syntax sugar for a common use of `Connect`, and is implemented as follows:
```
export function connector (source, render) {
  return (props) => <Connect source={source} render={render} passProps={props} />;
}
```
This enables an extremely concise way to define pure functional components that subcribe to static sources, e.g.
```
const InputStore = {value: ''};
const Input = connector(InputStore,
  (store, props) => <input type="text" value={store.value} onInput={(event) => issue(store, {value: event.target.value})} />
);
```
...will define a managed `input` component that tracks and updates the `value` field from the object `InputStore`.
