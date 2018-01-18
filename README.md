# zine

zine is a simple and tiny publisher/subscriber system for building reactive applications. See also [react-zine](https://github.com/j-s-n/react-zine), for using zine to build reactive user interfaces.

## Installation

To install (using npm):
```
npm install zine --save
```

## Importing
```
import {publish, subscribe, issue, unsubscribe, unsubscribeAll, publishable} from 'zine';
```

## Usage

See the [API Docs](docs/API.md) for basic usage information. A tutorial is coming soon.

## Recent changes

### Version 5.0

The React-specific behavior (previously in zine/Connect) has been factored out into a new package react-zine.

## License

MIT
