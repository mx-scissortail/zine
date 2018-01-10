'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

exports.publishable = publishable;
exports.subscribe = subscribe;
exports.unsubscribe = unsubscribe;
exports.unsubscribeAll = unsubscribeAll;
exports.publish = publish;
exports.issue = issue;
var allSubscriptions = new WeakMap();

function publishable(subject) {
  if (subject !== null) {
    var subjectType = typeof subject === 'undefined' ? 'undefined' : _typeof(subject);
    if (subjectType === 'object' || subjectType === 'function') {
      return true;
    }
  }
  return false;
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
    // Consider computation/memory tradeoff of potentially removing empty subscription lists here
    var filteredSubs = [];
    var numSubscribers = subscriptions.length;
    for (var i = 0; i < numSubscribers; i++) {
      var subscription = subscriptions[i];
      if (subscription !== subscriptionToCancel) {
        filteredSubs.push(subscription);
      }
    }
    allSubscriptions.set(subject, filteredSubs);
  }
};

function unsubscribeAll(subject) {
  allSubscriptions.delete(subject);
};

function publish(subject, value) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    var numSubscribers = subscriptions.length;
    for (var i = 0; i < numSubscribers; i++) {
      subscriptions[i](subject, value);
    }
  }

  return value;
};

function issue(target, source) {
  Object.assign(target, source);
  publish(target, source);
};
