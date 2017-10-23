import React from 'react';
import {publishable, subscribe, unsubscribe} from '../index.js';

class Subscriber extends React.Component {
  constructor(props, spec, transform, component, subscription, renderer) {
    super(props);
    this.subscriptionSpec = spec;
    this.transform = transform;
    this.component = component;
    this.subscription = subscription;
    this.render = renderer;
    this.canUpdate = true;

    this.update = (value) => {
      // value is only occasionally defined here, because of how zine.publish uses it as an optional second argument
      if (this.canUpdate) {
        this.setState({data: this.transform(this.subscription, value)});
      }
    };

    if (publishable(this.subscription)) {
      subscribe(this.subscription, this.update);
    } // TODO: add debug a warning when passing unpublishable value to subscription prop?

    this.state = {data: transform(this.subscription)};
  }

  componentWillUnmount () {
    this.canUpdate = false; // prevent updates from triggering re-renders after component decides to unmount
    unsubscribe(this.subscription, this.update);
  }
}

// default renderer uses React.createElement
function defaultRenderer () {
  return React.createElement(this.component, Object.assign({}, this.props, this.state.data));
}

// direct functional renderer bypasses React.createElement - useful for when packing/unpacking props is useless
export function directFunctionalRenderer () {
  return this.component(this.state.data, this.props);
}

const pass = (sub) => sub; // default transform just merges the subscribed object into props

function verifyTransform (transform) {
  if (typeof transform !== 'function') {
    throw new TypeError(`Can't create subscriber: transform must be a function, got ${transform === null ? 'null' : typeof transform}`);
  }
}

export function connector (subscriptionSpec, transform = pass) {
  verifyTransform(transform);
  if (typeof subscriptionSpec === 'string') {
    return (component, renderer = defaultRenderer) => class extends Subscriber {
      constructor (props) {
        super(props, subscriptionSpec, transform, component, props[subscriptionSpec], renderer);
      }

      componentWillReceiveProps (nextProps) {
        let oldSubscription = this.props[this.subscriptionSpec];
        let subscription = this.subscription = nextProps[this.subscriptionSpec];
        if (subscription != oldSubscription) {
          unsubscribe(oldSubscription, this.update);
          if (publishable(subscription)) {
            subscribe(subscription, this.update);
          } // TODO: add a debug warning when passing unpublishable value to subscription prop?
        }
        this.setState({data: this.transform(subscription)});
      }
    };
  } else if (publishable(subscriptionSpec)) {
    return (component, renderer = defaultRenderer) => class extends Subscriber {
      constructor (props) {
        super(props, subscriptionSpec, transform, component, subscriptionSpec, renderer);
      }
    };
  } else {
    throw new TypeError(`connector(subscriptionSpec, transform): subscriptionSpec must be a string, object or function, got ${subscriptionSpec === null ? 'null' : typeof subscriptionSpec}`);
  }
}

export function directConnector (subscriptionSpec, transform) {
  return (component) => connector(subscriptionSpec, transform)(component, directFunctionalRenderer);
}

export function propInjector (subscriptionSpec, prop, transform = pass) {
  verifyTransform(transform);
  if (typeof prop !== 'string') {
    throw new TypeError(`propInjector/propConnector: prop argument must be a string, got ${prop === null ? 'null' : typeof prop}`);
  }
  return connector(subscriptionSpec, (sub, val) => ({[prop]: transform(sub, val)}));
}

export function propConnector (prop, transform = pass) {
  return propInjector(prop, prop, transform);
}

export function createSubscriber (propSpec, component) {
  return (Array.isArray(propSpec) ? propSpec : [propSpec]).reduce((comp, prop) => propConnector(prop)(comp), component);
}
