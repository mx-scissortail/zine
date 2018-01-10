# zine

zine is a simple state management system for building reactive user interfaces that pairs well with React. It aims to be small (the source is about 3.2kb unminified), performant and much easier to use than most state management systems for React. Using zine you can easily externalize state (i.e. pull state data out of `this.setState` and manage it independently of your components) and reactively inject updates into arbitrary locations in the hierarchy. See the article series [State Architecture Patterns in React: A Review](https://medium.com/@skylernelson_64801/state-architecture-patterns-in-react-a-review-df02c1e193c6) for more information.

## Installation

To install (using npm):
```
npm install zine --save
```

## Importing
zine is split into two modules, `zine` (which contains the basic pub/sub system) and `zine/Connect` (which contains the React-specific functionality).
```
import {publish, subscribe, issue, unsubscribe, unsubscribeAll, publishable} from 'zine';
import {Connect, connector} from 'zine/react';
```

## Usage

See the [API Docs](docs/API.md) for basic usage information. A tutorial is coming soon.

## Recent changes

### Version 4.0

The behavior of `publish` has changed very slightly: `publish(subject[, value])` now calls each subscription to `subject` with `subject` as the first argument. Now it's easier to subscribe an unbound function to multiple subjects and have it respond to changes in each, and this makes the signature of `subscribe` much more consistent with `connect`.

Additionally, the base `zine` module has gained the function `unsubscribeAll`, which is used to drop a subject from the global subscriptions list.

### Version 3.0

The main change in version 3.0 was a total refactoring of the React-specific functionality. React-related functions were removed from the basic `zine` import, and there is now a separate `zine/Connect` module that exports `Connect` and the helper function `connector`.

Other changes:
* Removed superfluous default export from `zine` module (use `import * as zine from 'zine'`)
* Added `issue` to the base `zine` module to conveniently merge state changes and publish in one step
* Switched to class syntax for compatibility with React 16
* Some source directory structure changes

## License

MIT
