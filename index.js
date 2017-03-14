import React from 'react';
import {subscribe, unsubscribe, publish, publishable} from './Publisher';

const sharedMethods = {
  componentWillMount: function () {
    this._zine.canUpdate = true;
    if (publishable(this._zine.subscription)) {
      subscribe(this._zine.subscription, this.update);
    } // TODO: add a warning here?
  },

  componentWillUnmount: function () {
    this._zine.canUpdate = false; // prevent updates from triggering re-renders after component decides to unmount
    unsubscribe(this._zine.subscription, this.update);
  },

  update: function (value) {
    // value is almost always undefined here, but can be because of how zine.publish uses it as an optional second argument
    if (this._zine.canUpdate) {
      this.setState({props: this._zine.transform(this._zine.subscription, value)});
    }
  },

  render: function () {
    return React.createElement(this._zine.component, Object.assign({}, this.props, this.state.props));
  }
};

const staticSubscriberMethods = {
  getInitialState: function () {
    this._zine.subscription = this._zine.subscriptionSpec;
    return {props: this._zine.transform(this._zine.subscription)};
  }
};

const dynamicSubscriberMethods = {
  getInitialState: function () {
    this._zine.subscription = this.props[this._zine.subscriptionSpec];
    return {props: this._zine.transform(this._zine.subscription)};
  },

  componentWillReceiveProps: function (nextProps) {
    var oldSubscription = this.props[this._zine.subscriptionSpec];
    var subscription = this._zine.subscription = nextProps[this._zine.subscriptionSpec];
    if (subscription != oldSubscription) {
      unsubscribe(oldSubscription, this.update);
      if (publishable(subscription)) {
        subscribe(subscription, this.update);
      } // TODO: add a warning here?
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
  var specType = (subscriptionSpec === null) ? 'null' : typeof subscriptionSpec;
  var methods = typeToMethodMap[specType];
  if (!methods) {
    throw new Error(`connector(subscriptionSpec, transform): subscriptionSpec must be a string, object or function, got ${specType}`);
  }
  if (typeof transform !== 'function') {
    throw new Error(`connector(subscriptionSpec, transform): transform must be a function, got ${typeof transform}`);
  }

  return function (component) {
    return React.createClass(Object.assign({}, sharedMethods, methods, {
        displayName: 'Subscriber',
        _zine: {
          component,
          subscriptionSpec,
          transform
        }
      }));
  };
};

export function propConnector (prop, transform = pass) {
  if (typeof prop !== 'string') {
    throw new Error(`propConnector(prop, transform): prop name must be a string, got ${typeof prop}`);
  }
  if (typeof transform !== 'function') {
    throw new Error(`connector(subscriptionSpec, transform): transform must be a function, got ${typeof transform}`);
  }
  return connector(prop, (sub, val) => ({[prop]: transform(sub, val)}));
};

export function createSubscriber (propSpec, component) {
  return (Array.isArray(propSpec) ? propSpec : [propSpec]).reduce((comp, prop) => propConnector(prop)(comp), component);
};

export * from './Publisher';

export default {subscribe, unsubscribe, publish, publishable, connector, propConnector, createSubscriber};
