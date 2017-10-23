const allSubscriptions = new WeakMap();

export function publishable (subject) {
  if (subject === null) return false;
  switch (typeof subject) {
    case 'object':
    case 'function':
      return true;
    default:
      return false;
  }
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

export function issue (target, source) {
  Object.assign(target, source);
  publish(target, source);
}
