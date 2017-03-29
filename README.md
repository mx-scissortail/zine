# zine

A simple system for publishing updates to React components

## Explanation

zine can make your React components automatically react to events that concern their information dependencies (e.g. props).

At the heart of zine is a simple publisher/subscriber system with a small twist. Whereas typical pub/sub systems allow for subscriptions to 'topics' or 'subjects', which are typically specified via a string label, zine's 'subjects' are Javascript objects (or functions).

So if you have an object `subject`, you can call `zine.subscribe(subject, callback)` and then whenever anyone calls `publish(subject)` or `publish(subject, value)`, `callback` will be called (with the optional `value` as an argument, if supplied). `subject` doesn't have to be an instance of some special class, you can subscribe to pretty much any object, or even a function. Similarly, `zine.unsubscribe(subject, callback)` removes the subscription.

However you usually won't have to manage your subscriptions manually, because zine also comes with a few utilities for magically automating subscriptions for React components, in the form of three subscriber component factories: `createSubscriber` (the simplest), `connector` (the most general) and `propConnector` (a mix of the other two).

### Using `createSubscriber`

If you have a React component `Foo`, you can declare a reactive version that responds to events that concern its `store` prop using `createSubscriber` like this:
```
const ReactiveFoo = zine.createSubscriber("store", Foo);
```
Then in your render method `<ReactiveFoo store={storeInstance} />` will render the exact same DOM that `<Foo store={storeInstance} />` would have. The difference is that `ReactiveFoo` will automatically manage a subscription to whatever is sent as its `store` prop, which in this case is the object `storeInstance`. So if you call `zine.publish(storeInstance)` from anywhere in your application, that instance of `ReactiveFoo` will re-render itself.

If the `store` prop sent to that instance of `ReactiveFoo` changes, e.g. from `storeInstance` to `someOtherStoreInstance` it'll automatically unsubscribe from `storeInstance` and subscribe to `someOtherStoreInstance`.

Note that `createSubscriber` is a factory for creating new *types* of React components out of existing *types* of React components, not *instances* of either kind. So, for example, do `createSubscriber('bar', Foo)` not `createSubscriber('bar', <Foo />)`, and call `createSubscriber` in the scope where you'd *define* a component, not the scope where you'd *instantiate* one - never call it inside a render method.

### Using `connector` and `propConnector`

`connector` and `propConnector` were added in version 1.1 and have a different call signature from `createSubscriber`. For various reasons, they return factory functions and thus their call signatures both involve a double invocation, e.g. `connector(subscription)(componentToWrap)` - this should be familiar if you've used Redux's `connect`. Both `connector` and `propConnector` have an optional `transform` argument that's used to get props to send down to the wrapped component.

As we've seen, with `createSubscriber`, we'd define a new subscriber component:
```
const ReactiveFoo = zine.createSubscriber("store", Foo);
```
And then rendering `<ReactiveFoo store={storeInstance} />` would subscribe to `storeInstance` and render `<Foo state={storeInstance} />`.

To use `propConnector`, we'd define a new subscriber component with a transformer function (note the chained function invocation):
```
const ReactiveFoo = zine.propConnector("store", transform)(Foo);
```
Then rendering `<ReactiveFoo store={storeInstance} />` would subscribe to `storeInstance` and render `<Foo state={transform(storeInstance)} />` (note the transformation step).

There are two differences between `connector` and `propConnector`. The first is that with `connector` the result of the transformer function is *merged* into the props sent to the wrapped component. This can make it easier to work with pure components. The second is that while `createSubscriber` and `propConnector` take a prop name (in the form of a string) as the first argument, `connector` can take either a prop name, an object or a function. In the latter cases, the resulting subscriber component will simply subscribe/unsubscribe to the passed in object/function on mount/unmount instead of watching a prop.

So this can be used to define a component that listens to a global of some sort:
```
const ReactiveFoo = zine.propConnector(globalStoreInstance, transform)(Foo);
```
And then rendering `<ReactiveFoo />` will subscribe to `globalStoreInstance` and render `<Foo {...transform(globalStoreInstance)} />` (note the spread merge).

## Installation

```
npm install zine --save
```

## Importing

zine is written in ES6 and transpiled to ES5 for compatibility. Both versions are included in the npm package. If you're using ES5, do this:
```
var zine = require('zine');
```
If you're using ES6+, you can include the original sources by importing the module like this:
```
import zine from 'zine/es6';
```
...or importing the functions it exports individually, e.g.
```
import {connector, propConnector, createSubscriber, publish, publishable, subscribe, unsubscribe} from 'zine/es6';
```
Importing the ES5 source from ES6 should work fine too, but will likely add a tiny amount of overhead if you're transpiling anyway.

## API

### `connector(subscriptionSpec, [transform])`

`connector` is the most general form of subscriber component factory. It doesn't directly create subscriber components, but returns a function that does. So calls to `connector` will typically have a double invocation with this signature: `connector(subscriptionSpec, [transform])(componentToWrap)`.

When calling connector, `subscriptionSpec` can be either a string, an object or a function. If it's a string, `connector` interprets this as a prop name and resulting subscriber components will automatically manage a subscription to whatever is passed in through that prop. If it's an object or function, the resulting subscriber component will simply subscribe/unsubscribe to that object/function on mount/unmount instead of watching a prop.

The purpose of the `transform` function is to translate the subject of subscriptions into props for the wrapped component. The first argument to `transform` is the actual object/function that the subscriber component is currently subscribed to, which we'll call `subject`.

`transform` is called in the following circumstances:
* During `componentWillMount` to get the initial props for the wrapped component
* Whenever `zine.publish(subject)` is called
* If the subscription's subject comes from a prop, transform will be called during `componentWillReceiveProps` (with the new subject if there is one)

`transform` takes a second, optional `value` argument. The only time `value` is defined is when `zine.publish(subject, value)` is called, in which case it's passed through to `transform`.

The result of `transform` should be a key/value object, which is merged into the props sent to the wrapped component. Props passed from the parent will be sent to the wrapped component, unless they're overwritten by the results from `transform`.

The default value of the `transform` argument simply returns `subject`.

#### Examples:

1. Given an object and no `transform` function...
```
const ReactiveFoo = zine.propConnector(globalStoreInstance)(Foo);
```
...rendering `<ReactiveFoo />` will subscribe to `globalStoreInstance` and render `<Foo {...globalStoreInstance} />`.


2. Given an object and a `transform` function...
```
const ReactiveFoo = zine.propConnector(globalStoreInstance, (store) => ({bar: store.bar, baz: store.baz}))(Foo);
```
...rendering `<ReactiveFoo />` will subscribe to `globalStoreInstance` and render `<Foo bar={globalStoreInstance.bar} baz={globalStoreInstance.baz} />`.


3. Given a prop name and a `transform` function...
```
const ReactiveFoo = zine.propConnector("store", transform)(Foo);
```
...rendering `<ReactiveFoo store={storeInstance} />` will subscribe to `storeInstance` and render `<Foo {...transform(storeInstance)} />`.

---
### `createSubscriber(props, componentToWrap)`

This creates a new React component class that automatically subscribes/unsubscribes to objects passed in through the specified prop(s).
Here `componentToWrap` is a React component (either a class or a stateless functional component) and `props` is either a string that identifies a single prop, or an array of strings that identify multiple props by name.

To define a reactive version of the component `Foo` that responds to events associated with its `store` prop, do this:
```
const ReactiveFoo = zine.createSubscriber('store', Foo);
```
Then replace instances of `<Foo store={storeInstance} />` with `<ReactiveFoo store={storeInstance} />`.

Instances of `ReactiveFoo` will render instances of `Foo` and pass all their props along unchanged.

`createSubscriber` is actually just a wrapper around the slightly more general `propConnector` (which is itself a wrapper around `connector`), so `createSubscriber("propName", componentToWrap)` is the same as `propConnector("propName")(componentToWrap)` and `connector("propName", (sub) => ({"propName": sub}))(componentToWrap)`.

Note that `createSubscriber` is the only subscriber factory that allows an array of prop names in the first argument. This creates a component that effectively subscribes to all the props in the array, but it does this by nesting subscribers: `createSubscriber(["propA", "propB"], componentToWrap)` is the same as `createSubscriber("propB", createSubscriber("propA", componentToWrap))`. Putting the prop most likely to frequently change first in the array is a minor optimization.

---
### `propConnector(prop, [transform])`

`propConnector` is a convenience wrapper around `connector`, for when you want a component that will subscribe to a single prop and pass it down to a wrapped component, with an optional transformation step.

`propConnector("propName")(component)` is the same as `createSubscriber("propName", component)`, while `propConnector("propName", transform)(component)` is the same as `connector("propName", (sub, value) => ({"propName": transform(sub, value)}))(component)`.

One potentially useful application of `propConnector` is if you want to create a component that subscribes to a function that's passed in as a prop (e.g. `state`), but pass the value of calling that function down to the wrapped component through the same prop. In this case you could do something like this:
```
const FunSubscriberFoo = propConnector("state", (subFn) => subFn())(Foo);
```
Then rendering `<FunSubscriberFoo state={fooStateFunction} />` will render `<Foo state={fooStateFunction()} />` whenever `fooStateFunction` is published.

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

Calling `publish(subject)` will trigger any subscriptions that were associated with `subject` at the time of that call to `publish`. If one of those subscriptions causes another to be added or removed (by calling `subscribe` or `unsubscribe`), that change won't affect what subscriptions are triggered by any currently executing calls to `publish`, but will affect all subsequent calls. However, this won't generally have any negative interactions with the lifecycle methods of subscriber components created by zine - unmounting subscriber components won't respond to further updates from zine, so `publish` won't trigger a re-render on an unmounting component.

---
### `publishable(subject)`

Returns `true` or `false` depending on whether `subject` is the kind of thing that we can attach subscriptions to. Currently, only objects and functions are accepted which means you can't subscribe to immutable values (like strings or numbers), but future versions may allow this. The current restriction owes to the use of `WeakMap` inside zine's pub/sub system.

The intended use of `publishable` is to gate calls to `subscribe`, e.g.
```
if (publishable(subject)) {
  subscribe(subject, subscription);
}
```
This is used to prevent `subscribe` from throwing an if it's possible that `subject` might not be an object or function.

---
### `subscribe(subject, subscription)`

Registers the callback `subscription` to be called whenever `publish(subject)` or `publish(subject, value)` are called.
There are a few caveats worth noting. First, `subject` can only be an object or a function. `subscribe` will throw an error if this isn't the case. See `publishable` for more information. Second, `subscribe` makes no effort to ensure that `subscription` is a callable function. If you register something that isn't callable, the subscription will be registered but subsequent calls to `publish` will throw errors. Third, see the documentation for `publish` for a small caveat about the result of calling `subscribe` during a call to `publish`.

Internally, zine uses a `WeakMap` to track subscriptions, so it won't leak references (and therefore memory). If you `subscribe` to an object and then lose all other references to it (and thus the ability to call `publish` on it), it will be garbage collected along with its subscription list.

---
### `unsubscribe(subject, subscription)`

Removes all instances of `subscription` from the list of callbacks associated with `subject`. See the documentation for `publish` for a small caveat about the result of calling `unsubscribe` during a call to `publish`.

## New in version 2.0

* Fixed ES5/6 require/import shenanigans
* Removed separate `Publisher` export
* Added test suite

## License

MIT
