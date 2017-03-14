const allSubscriptions = new WeakMap();
const referenceTypes = {
  'object': true,
  'function': true
};

export function publishable (subject) {
  return subject !== null && referenceTypes.hasOwnProperty(typeof subject);
};

export function subscribe (subject, subscription) {
  var subscriptions = allSubscriptions.get(subject);

  if (subscriptions) {
    subscriptions.push(subscription);
  } else {
    var subjectType = (subject === null) ? 'null' : typeof subject;
    if (referenceTypes.hasOwnProperty(subjectType)) {
      allSubscriptions.set(subject, [subscription]);
    } else {
      throw new Error(`subscribe(subject, subscription): subject must be an object or function, got ${subjectType}`);
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
