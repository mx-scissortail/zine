# zine

A simple state management system for building reactive user interfaces

## Installation

To install (using npm):
```
npm install zine --save
```

## Importing
zine is split into two modules, `zine` (which contains the basic pub/sub system) and `zine/Connect` (which contains the React-specific functionality).
```
import {publish, subscribe, issue, unsubscribe, publishable} from 'zine';
import {Connect, connector} from 'zine/react';
```

## TODO for version 3.0

* Update documentation

## New in version 3.0

The main change in version 3.0 was a total refactoring of the React-specific functionality. React-related functions were removed from the basic `zine` import, and there is now a separate `zine/Connect` module that exports `Connect` and the helper function `connector`.

Other changes:
* Removed superfluous default export from `zine` module (use `import * as zine from 'zine'`)
* Added `issue` to the base `zine` module to conveniently merge state changes and publish in one step
* Switched to class syntax for compatibility with React 16
* Some minor directory structure changes

## License

MIT
