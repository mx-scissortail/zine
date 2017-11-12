const allSubscriptions = new WeakMap();

export function publishable (subject) {
  if (subject !== null) {
    let subjectType = typeof subject;
    if (subjectType === 'object' || subjectType === 'function') {
      return true;
    }
  }
  return false;
};

export function subscribe (subject, subscription) {
  let subscriptions = allSubscriptions.get(subject);

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
  let subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    // Consider computation/memory tradeoff of potentially removing empty subscription lists here
    let filteredSubs = [];
    let numSubscribers = subscriptions.length;
    for (let i = 0; i < numSubscribers; i++) {
      let subscription = subscriptions[i];
      if (subscription !== subscriptionToCancel) {
        filteredSubs.push(subscription);
      }
    }
    allSubscriptions.set(subject, filteredSubs);
  }
};

export function publish (subject, value) {
  let subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    let numSubscribers = subscriptions.length;
    for (let i = 0; i < numSubscribers; i++) {
      subscriptions[i](value);
    }
  }

  return value;
};

export function issue (target, source) {
  Object.assign(target, source);
  publish(target, source);
}
