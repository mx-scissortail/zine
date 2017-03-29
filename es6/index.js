import React from 'react';

function specType (spec) {
  return (spec === null) ? 'null' : typeof spec;
}

// Publish/Subscribe implementation

const allSubscriptions = new WeakMap();

const referenceTypes = {
  'object': true,
  'function': true
};

export function publishable (subject) {
  return referenceTypes.hasOwnProperty(specType(subject));
};

export function subscribe (subject, subscription) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    subscriptions.push(subscription);
  } else {
    if (publishable(subject)) {
      allSubscriptions.set(subject, [subscription]);
    } else {
      throw new TypeError(`subscribe(subject, subscription): subject must be an object or function, got ${specType(subject)}`);
    }
  }

  return subscription;
};

export function unsubscribe (subject, subscriptionToCancel) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    // Consider computation/memory tradeoff of removing empty subscription lists here
    allSubscriptions.set(subject, subscriptions.filter((subscription) => subscription !== subscriptionToCancel));
  }
};

export function publish (subject, value) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    var numSubscribers = subscriptions.length;
    for (var i = 0; i < numSubscribers; i++) {
      subscriptions[i](value);
    }
  }

  return value;
};

// React-related

const sharedMethods = {
  componentWillMount: function () {
    this._zine.canUpdate = true;
    if (publishable(this.subscription)) {
      subscribe(this.subscription, this.update);
    } // TODO: add a warning when passing unpublishable value to subscription prop?
  },

  componentWillUnmount: function () {
    this._zine.canUpdate = false; // prevent updates from triggering re-renders after component decides to unmount
    unsubscribe(this.subscription, this.update);
  },

  update: function (value) {
    // value is almost always undefined here, but can be because of how zine.publish uses it as an optional second argument
    if (this._zine.canUpdate) {
      this.setState({props: this._zine.transform(this.subscription, value)});
    }
  },

  render: function () {
    return React.createElement(this._zine.component, Object.assign({}, this.props, this.state.props));
  }
};

const staticSubscriberMethods = {
  getInitialState: function () {
    this.subscription = this._zine.subscriptionSpec;
    return {props: this._zine.transform(this.subscription)};
  }
};

const dynamicSubscriberMethods = {
  getInitialState: function () {
    this.subscription = this.props[this._zine.subscriptionSpec];
    return {props: this._zine.transform(this.subscription)};
  },

  componentWillReceiveProps: function (nextProps) {
    var oldSubscription = this.props[this._zine.subscriptionSpec];
    var subscription = this.subscription = nextProps[this._zine.subscriptionSpec];
    if (subscription != oldSubscription) {
      unsubscribe(oldSubscription, this.update);
      if (publishable(subscription)) {
        subscribe(subscription, this.update);
      } // TODO: add a warning when passing unpublishable value to subscription prop?
    }
    this.setState({props: this._zine.transform(subscription)});
  }
};

const typeToMethodMap = {
  'string': dynamicSubscriberMethods,
  'object': staticSubscriberMethods,
  'function': staticSubscriberMethods
};

function pass (sub) { // default transform just merges the subscribed object into props
  return sub;
}

export function connector (subscriptionSpec, transform = pass) {
  var methods = typeToMethodMap[specType(subscriptionSpec)];
  if (!methods) { throw new TypeError(`connector(subscriptionSpec, transform): subscriptionSpec must be a string, object or function, got ${specType(subscriptionSpec)}`); }
  if (specType(transform) !== 'function') { throw new TypeError(`connector(subscriptionSpec, transform): transform must be a function, got ${specType(transform)}`); }

  return (component) => React.createClass(Object.assign({}, sharedMethods, methods, {
    displayName: 'Subscriber',
    _zine: {
      component,
      subscriptionSpec,
      transform
    }
  }));
};

export function propConnector (prop, transform = pass) {
  if (specType(prop) !== 'string') { throw new TypeError(`propConnector(prop, transform): prop name must be a string, got ${specType(prop)}`); }
  if (specType(transform) !== 'function') { throw new TypeError(`propConnector(subscriptionSpec, transform): transform must be a function, got ${specType(transform)}`); }

  return connector(prop, (sub, val) => ({[prop]: transform(sub, val)}));
};

export function createSubscriber (propSpec, component) {
  return (Array.isArray(propSpec) ? propSpec : [propSpec]).reduce((comp, prop) => propConnector(prop)(comp), component);
};

export default {publishable, subscribe, unsubscribe, publish, connector, propConnector, createSubscriber};
