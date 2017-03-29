import React from 'react';
import {assert} from 'chai';
import {mount} from 'enzyme';
import sinon from 'sinon';
import createMockDOM from 'jsdom-global';

import zine from '../index.js';

createMockDOM();

const ValueDiv = ({value}) => <div className={`test ${value}`} />;
const WrappedValueDiv = ({store: {value}}) => <div className={`test ${value}`} />;
const WrappedMultiValueDiv = ({storeA: {value}, storeB: {secondValue}}) => <div className={`test ${value} ${secondValue}`} />;

const mountTest = (component, props) => mount(React.createElement(component, props));
const testClass = (wrapper, cn) => assert.isTrue(wrapper.find('.test').hasClass(cn));
const testClassAbsent = (wrapper, cn) => assert.isFalse(wrapper.find('.test').hasClass(cn));


// publishable
describe('publishable', function () {
  it('accepts all publishable types', function () {
    [{}, () => 0].forEach((type) => assert.isTrue(zine.publishable(type), `[should accept type: ${typeof type}]`));
  });

  it('rejects all non-publishable types', function () {
    ["string", undefined, null, true, 1, Symbol()].forEach((type) => assert.isNotTrue(zine.publishable(type), `[should reject type: ${typeof type}]`));
  });
});

// subscribe/publish/unsubscribe
describe('subscribe/publish/unsubscribe', function () {
  it('publishes updates to subscribers', function () {
    const callback = sinon.spy();
    const sub = {};
    zine.subscribe(sub, callback);
    zine.publish(sub);
    assert.isTrue(callback.calledOnce);
  });

  it('publishes optional value argument on update', function () {
    const callback = sinon.spy();
    const sub = {};
    zine.subscribe(sub, callback);
    zine.publish(sub, 1);
    assert.isTrue(callback.calledWith(1));
  });

  it('stops publishing on unsubscribe', function () {
    const callback = sinon.spy();
    const sub = {};
    zine.subscribe(sub, callback);
    zine.publish(sub);
    zine.unsubscribe(sub, callback);
    zine.publish(sub);
    assert.isTrue(callback.calledOnce);
  });
});

// connector
describe('connector', function () {
  it('rejects inappropriate subscription specs', function () {
    [undefined, null, true, 1, Symbol()].forEach((type) => assert.throws(() => zine.connector(type), TypeError, '', `[offending type: ${typeof type}]`));
  });

  it('rejects inappropriate transform functions', function () {
    [{}, null, true, 1, Symbol()].forEach((type) => assert.throws(() => zine.connector({}, type), TypeError, '', `[offending type: ${typeof type}]`));
  });

  describe('static subscription (object/function)', function () {
    it('re-renders on update', function () {
      const store = {value: 'untouched'};
      const wrapper = mountTest(zine.connector(store)(ValueDiv));
      testClass(wrapper, 'untouched');
      store.value = 'touched';
      zine.publish(store);
      testClass(wrapper, 'touched');
    });

    it('uses transform function', function () {
      const store = {value: 'untouched'};
      const transform = (store) => (store.value == 'touched') ? {value: 'transformed'} : store;
      const wrapper = mountTest(zine.connector(store, transform)(ValueDiv));
      testClass(wrapper, 'untouched');
      store.value = 'touched';
      zine.publish(store);
      testClass(wrapper, 'transformed');
    });
  });

  describe('dynamic subscription (via prop)', function () {
    it('re-renders on update', function () {
      const store = {value: 'untouched'};
      const wrapper = mountTest(zine.connector('store')(ValueDiv), {store});
      testClass(wrapper, 'untouched');
      store.value = 'touched';
      zine.publish(store);
      testClass(wrapper, 'touched');
    });

    it('uses transform function', function () {
      const store = {value: 'untouched'};
      const transform = (sub) => (sub.value == 'touched') ? {value: 'transformed'} : sub;
      const wrapper = mountTest(zine.connector('store', transform)(ValueDiv), {store});
      testClass(wrapper, 'untouched');
      store.value = 'touched';
      zine.publish(store);
      testClass(wrapper, 'transformed');
    });

    it('switches subscription on prop change', function () {
      const storeA = {value: 'untouched'};
      const storeB = {value: 'untouched'};
      const wrapper = mountTest(zine.connector('store')(ValueDiv), {store: storeA});
      testClass(wrapper, 'untouched');
      storeA.value = 'touched';
      zine.publish(storeA);
      testClass(wrapper, 'touched');
      wrapper.setProps({store: storeB});
      testClass(wrapper, 'untouched');
      storeB.value = 'touched';
      zine.publish(storeB);
      testClass(wrapper, 'touched');
      storeA.value = 'retouched';
      zine.publish(storeA);
      testClassAbsent(wrapper, 'retouched');
    });
  });

  it('unsubscribes before unmounting', function () {
    const store = {value: 'unused', renderChild: true};
    const Wrapped = zine.connector(store)(ValueDiv);
    const ParentSubscriber = ({renderChild}) => <div>{renderChild && <Wrapped />}</div>;

    const wrapper = mountTest(zine.connector(store)(ParentSubscriber));
    sinon.spy(console, 'error');
    store.renderChild = false;
    zine.publish(store);
    assert.isFalse(console.error.called);
  });

  it('renders as child without triggering parent re-render', function () {
    const Wrapped = zine.connector('store')(ValueDiv);
    var renderCount = 0;
    const Parent = ({store}) => <div className={'parent ' + (renderCount++ > 0 ? 'rerendered' : '')}><Wrapped store={store} /></div>;

    const store = {value: 'untouched'};
    const wrapper = mountTest(Parent, {store});
    testClass(wrapper, 'untouched');
    assert.isFalse(wrapper.find('.parent').hasClass('rerendered'));
    store.value = 'touched';
    zine.publish(store);
    testClass(wrapper, 'touched');
    assert.isFalse(wrapper.find('.parent').hasClass('rerendered'));
  });

  it('creates independently reusable components', function () {
    const Wrapped = zine.connector('store')(({id, value}) => <div className={`${id} ${value}`} />);
    const storeA = {value: 'untouched'};
    const storeB = {value: 'untouched'};

    const wrapper = mountTest(() => <div><Wrapped id='A' store={storeA} /><Wrapped id='B' store={storeB} /></div>);
    assert.isTrue(wrapper.find('.A').hasClass('untouched'));
    assert.isTrue(wrapper.find('.B').hasClass('untouched'));
    storeA.value = 'touched';
    zine.publish(storeA);
    assert.isTrue(wrapper.find('.A').hasClass('touched'));
    assert.isFalse(wrapper.find('.B').hasClass('touched'));
    storeB.value = 'alsoTouched';
    zine.publish(storeB);
    assert.isTrue(wrapper.find('.B').hasClass('alsoTouched'));
    assert.isFalse(wrapper.find('.A').hasClass('alsoTouched'));
  });
});

// propConnector
describe('propConnector', function () {
  it('rejects inappropriate subscription specs', function () {
    [{}, () => 0, undefined, null, true, 1, Symbol()].forEach((type) => assert.throws(() => zine.propConnector(type), Error, '', `[offending type: ${typeof type}]`));
  });

  it('rejects inappropriate transform functions', function () {
    [{}, null, true, 1, Symbol()].forEach((type) => assert.throws(() => zine.propConnector({}, type), Error, '', `[offending type: ${typeof type}]`));
  });

  it('wraps default transform function', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(zine.propConnector('store')(WrappedValueDiv), {store});
    testClass(wrapper, 'untouched');
    store.value = 'touched';
    zine.publish(store);
    testClass(wrapper, 'touched');
  });

  it('wraps custom transform function', function () {
    const store = {value: 'untouched'};
    const transform = (store) => (store.value == 'touched') ? {value: 'transformed'} : store;
    const wrapper = mountTest(zine.propConnector('store', transform)(WrappedValueDiv), {store});
    testClass(wrapper, 'untouched');
    store.value = 'touched';
    zine.publish(store);
    testClass(wrapper, 'transformed');
  });
});

// createSubscriber
describe('createSubscriber', function () {
  it('accepts a single prop name', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(zine.createSubscriber('store', WrappedValueDiv), {store});
    testClass(wrapper, 'untouched');
    store.value = 'touched';
    zine.publish(store);
    testClass(wrapper, 'touched');
  });

  it('accepts multiple prop names', function () {
    const storeA = {value: 'untouched'};
    const storeB = {secondValue: 'alsoUntouched'};
    const wrapper = mountTest(zine.createSubscriber(['storeA', 'storeB'], WrappedMultiValueDiv), {storeA, storeB});
    testClass(wrapper, 'untouched');
    testClass(wrapper, 'alsoUntouched');
    storeA.value = 'touched';
    zine.publish(storeA);
    testClass(wrapper, 'touched');
    testClass(wrapper, 'alsoUntouched');
    storeB.secondValue = 'alsoTouched';
    zine.publish(storeB);
    testClass(wrapper, 'touched');
    testClass(wrapper, 'alsoTouched');
  });
});
