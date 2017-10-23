# zine

A simple state management system for building reactive user interfaces

## Installation

To install (using npm):
```
npm install zine --save
```

## Importing
zine is split into two modules, `zine` (which contains the basic pub/sub system) and `zine/react` (which contains the React-specific functionality).
```
import {publish, subscribe, unsubscribe, publishable} from 'zine';
import {connector, directConnector, directFunctionalRenderer, propInjector, propConnector, createSubscriber} from 'zine/react';
```

## TODO for version 3.0

* Update documentation
* Add tests for new features

## New in version 3.0

* Split React-specific functionality into `zine/react`, removed default export from `zine` module (use `import * as zine from 'zine'`)
* Added `issue` to the base `zine` module to conveniently merge state changes and publish in one step
* Switched to class syntax for compatibility with React 16
* Added an optional `renderer` parameter to the function returned by `connect` for overriding wrapper component renderers
* Added `directConnector` and `directFunctionalRenderer` which enable a straightforward use of the aforementioned custom renderer functionality
* Added `propInjector`

## License

MIT
