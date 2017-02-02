# zine

A simple system for publishing updates to React components

## Explanation

zine can make your React components automatically react to events that concern their props.

At the heart of zine is a simple publisher/subscriber system with a small twist. Whereas typical pub/sub systems allow for subscriptions to 'topics' or 'subjects', which are typically specified via a string label, zine's 'subjects' are Javascript objects (or functions).

So if you have an object `subject`, you can call `zine.subscribe(subject, callback)` and then whenever anyone calls `publish(subject)` or `publish(subject, value)`, `callback` will be called (with the optional `value` as an argument, if supplied). `subject` doesn't have to be an instance of some special class, you can subscribe to pretty much any object, or even a function. Similarly, `zine.unsubscribe(subject, callback)` removes the subscription.

However you usually won't have to manage your subscriptions manually, because zine also comes with a utility for magically automating subscriptions for React components. If you have a React component `Foo`, you can declare a reactive version that responds to events that concern its `store` prop like this:
```
const ReactiveFoo = zine.makeSubscriber('store', Foo);
```
Then in your render method `<ReactiveFoo store={storeInstance} />` will render the exact same DOM that `<Foo store={storeInstance} />` would have. The difference is that `ReactiveFoo` will automatically manage a subscription to whatever is sent as its `store` prop, which in this case is the object `storeInstance`. So if you call `zine.publish(storeInstance)` from anywhere in your application, that instance of `ReactiveFoo` will re-render itself.

If the `store` prop sent to that instance of `ReactiveFoo` changes, e.g. from `storeInstance` to `someOtherStoreInstance` it'll automatically unsubscribe from `storeInstance` and subscribe to `someOtherStoreInstance`.

Internally, zine uses a `WeakMap` to track subscriptions, so it won't leak references (and therefore memory). If you `subscribe` to an object and then lose all other references to it (and thus the ability to call `publish` on it), it will be garbage collected along with its subscription list.

## Installation

```
npm install zine
```

## Importing

You can You can import `zine` as a module
```
import zine from 'zine';
```
...and call methods on it, e.g. `zine.publish(foo)`. Or you can also individually import any of its methods, i.e.
```
import {createSubscriber, publish, publishable, subscribe, unsubscribe} from 'zine';
```
...and use them on their own, e.g. `subscribe(foo)`.

If you don't want `createSubscriber`, and thus the React dependency, you can import the pub/sub methods independently, e.g.
```
import {publish, publishable, subscribe, unsubscribe} from 'zine/Publisher';
```

## API

### `createSubscriber(props, component)`

This creates a new React component class that automatically subscribes/unsubscribes to objects passed in through the specified prop(s).
Here `component` is a React component (either a class or a stateless functional component) and `props` is either a string that identifies a single prop, or an array of strings that identify multiple props by name.

To define a reactive version of the component `Foo` that responds to events associated with its `store` prop, do this:
```
const ReactiveFoo = zine.makeSubscriber('store', Foo);
```
Then replace instances of `<Foo store={storeInstance} />` with `<ReactiveFoo store={storeInstance} />`.

Instances of `ReactiveFoo` will render instances of `Foo` and pass all their props along unchanged.

Note that `createSubscribe` makes a new *type* of React component out of an existing *type* of React component, not an *instance* of either kind. So do `createSubscriber('bar', Foo)` not `createSubscriber('bar', <Foo />)`, and call `createSubscriber` in the scope where you'd *define* a component, not the scope where you'd *instantiate* one - never call it inside a render method.

### `publish(subject[, value])`

Publishes events associated with a given `subject`. If you've previously called `subscribe(subject, subscription)`, `publish(subject)` will trigger `subscription()`, and `publish(subject, value)` will trigger `subscription(value)`. Callbacks are triggered in the order of subscription.

The typical use here is to have some object that contains data, e.g.
```
var foo = {
  bar: true
};
```
Then if you mutate `foo` in some way (e.g. `foo.bar = false;`), you can call `publish(foo)` to notify any subscribers that depend on it to update. Having objects call `publish(this)` inside of methods is also fine.

Calling `publish(subject)` will trigger any subscriptions that were associated with `subject` at the time of that call to `publish`. If one of those subscriptions causes another to be added or removed (by calling `subscribe` or `unsubscribe`), that change won't affect what subscriptions are triggered by any currently executing calls to `publish`, but will affect all subsequent calls.

### `publishable(subject)`

Returns `true` or `false` depending on whether `subject` is the kind of thing that we can attach subscriptions to. Currently, only objects and functions are accepted which means you can't subscribe to immutable values (like strings or numbers), but future versions may allow this. The current restriction owes to the use of `WeakMap` inside zine's pub/sub system.

The intended use of `publishable` is to gate calls to `subscribe`, e.g.
```
if (publishable(subject)) {
  subscribe(subject, subscription);
}
```
This is used to prevent `subscribe` from throwing a `TypeError` if it's possible that `subject` might not be an object or function.

### `subscribe(subject, subscription)`

Registers the callback `subscription` to be called whenever `publish(subject)` or `publish(subject, value)` are called.
There are a few caveats worth noting. First, `subject` can only be an object or a function. `subscribe` will throw a `TypeError` if this isn't the case. See `publishable` for more information. Second, `subscribe` makes no effort to ensure that `subscription` is a callable function. If you register something that isn't callable, the subscription will be registered but subsequent calls to `publish` will throw errors. Third, see the documentation for `publish` for a small caveat about the result of calling `subscribe` during a call to `publish`.

### `unsubscribe(subject, subscription)`

Removes all instances of `subscription` from the list of callbacks associated with `subject`. See the documentation for `publish` for a small caveat about the result of calling `unsubscribe` during a call to `publish`.

## License

MIT
