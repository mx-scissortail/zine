'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.publishable = publishable;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.publish = publish;
exports.issue = issue;
var allSubscriptions = new WeakMap();

function publishable(subject) {
  if (subject === null) return false;
  switch (typeof subject === 'undefined' ? 'undefined' : _typeof(subject)) {
    case 'object':
    case 'function':
      return true;
    default:
      return false;
  }
};

function subscribe(subject, subscription) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    subscriptions.push(subscription);
  } else {
    if (publishable(subject)) {
      allSubscriptions.set(subject, [subscription]);
    } else {
      throw new TypeError('subscribe(subject, subscription): subject must be an object or function, got ' + specType(subject));
    }
  }

  return subscription;
};

function unsubscribe(subject, subscriptionToCancel) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    // Consider computation/memory tradeoff of removing empty subscription lists here
    allSubscriptions.set(subject, subscriptions.filter(function (subscription) {
      return subscription !== subscriptionToCancel;
    }));
  }
};

function publish(subject, value) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    var numSubscribers = subscriptions.length;
    for (var i = 0; i < numSubscribers; i++) {
      subscriptions[i](value);
    }
  }

  return value;
};

function issue(target, source) {
  Object.assign(target, source);
  publish(target, source);
}
