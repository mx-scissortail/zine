import React from 'react';
import {subscribe, unsubscribe, publish, publishable} from './Publisher';

const SubscriberMethods = {
  componentWillMount: function () {
    this.unsubscribe = {};
    this.register({}, this.props);
  },

  componentWillReceiveProps: function (nextProps) {
    this.register(this.props, nextProps);
  },

  componentWillUnmount: function () {
    for (var index in this.subscriptionProps) {
      var prop = this.props[this.subscriptionProps[index]];
      if (prop) {
        unsubscribe(prop, this.update);
      }
    }
  },

  register: function (props, nextProps) {
    for (var index in this.subscriptionProps) {
      var key = this.subscriptionProps[index];
      var oldProp = props[key];
      var newProp = nextProps[key];
      if (oldProp != newProp) {
        if (oldProp) {
          unsubscribe(oldProp, this.update);
        }
        if (newProp) {
          subscribe(newProp, this.update);
        }
      }
    }
  },

  update: function () {
    this.setState({});  // forceUpdate might work here, but I suspect there are weird race conditions
  }
};

/*
  A higher order component wrapper
  Takes a child component and creates a wrapper component that just passes all props down to the child
  If any of the props passed to the wrapper are Observables, the wrapper maintains a subscription to them and re-renders whenever they update
*/
export function createSubscriber (props, component) {
  return React.createClass(Object.assign({
    subscriptionProps: typeof props == 'string' ? [props] : props,

    displayName: `Subscriber[${props.toString()}]`,

    render: function () {
      // TODO: verify that this works with children
      return React.createElement(component, this.props, this.props.children);
    }
  }, SubscriberMethods));
};

export * from './Publisher';

export default {subscribe, unsubscribe, publish, publishable, createSubscriber};
