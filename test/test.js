// TODO: add propInjector tests
import React from 'react';
import {assert} from 'chai';
import {mount} from 'enzyme';
import sinon from 'sinon';
import createMockDOM from 'jsdom-global';

import * as zine from '../index.js';
import {connector, propInjector, propConnector, createSubscriber, directFunctionalRenderer, directConnector} from '../react/index.js';

createMockDOM();

const render = (value, secondValue) => secondValue ? <div>{value} {secondValue}</div> : <div>{value}</div>;
const ValueDiv = ({value, secondValue}) => render(value, secondValue);
const WrappedValueDiv = ({store: {value}}) => render(value);
const WrappedMultiValueDiv = ({storeA: {value}, storeB: {secondValue}}) => render(value, secondValue);

const mountTest = (component, props) => mount(React.createElement(component, props));

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
    [undefined, null, true, 1, Symbol()].forEach((type) => assert.throws(() => connector(type), TypeError, '', `[offending type: ${typeof type}]`));
  });

  it('rejects inappropriate transform functions', function () {
    [{}, null, true, 1, Symbol()].forEach((type) => assert.throws(() => connector({}, type), TypeError, '', `[offending type: ${typeof type}]`));
  });

  it('renders and passes props', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(connector(store)(ValueDiv), {secondValue: 'present'});
    assert.equal(wrapper.html(), '<div>untouched present</div>');
  });

  it('renders and passes props (with directFunctionalRenderer)', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(connector(store)(
      (state, props) => render(state.value, props.secondValue),
      directFunctionalRenderer
    ), {secondValue: 'present'});
    assert.equal(wrapper.html(), '<div>untouched present</div>');
  });


  describe('static subscription (object/function)', function () {
    it('re-renders on update', function () {
      const store = {value: 'untouched'};
      const wrapper = mountTest(connector(store)(ValueDiv));
      assert.equal(wrapper.html(), '<div>untouched</div>');
      store.value = 'touched';
      zine.publish(store);
      assert.equal(wrapper.html(), '<div>touched</div>');
    });

    it('uses transform function', function () {
      const store = {value: 'untouched'};
      const transform = (store) => (store.value == 'touched') ? {value: 'transformed'} : store;
      const wrapper = mountTest(connector(store, transform)(ValueDiv));
      assert.equal(wrapper.html(), '<div>untouched</div>');
      store.value = 'touched';
      zine.publish(store);
      assert.equal(wrapper.html(), '<div>transformed</div>');
    });
  });

  describe('dynamic subscription (via prop)', function () {
    it('re-renders on update', function () {
      const store = {value: 'untouched'};
      const wrapper = mountTest(connector('store')(ValueDiv), {store});
      assert.equal(wrapper.html(), '<div>untouched</div>');
      store.value = 'touched';
      zine.publish(store);
      assert.equal(wrapper.html(), '<div>touched</div>');
    });

    it('uses transform function', function () {
      const store = {value: 'untouched'};
      const transform = (sub) => (sub.value == 'touched') ? {value: 'transformed'} : sub;
      const wrapper = mountTest(connector('store', transform)(ValueDiv), {store});
      assert.equal(wrapper.html(), '<div>untouched</div>');
      store.value = 'touched';
      zine.publish(store);
      assert.equal(wrapper.html(), '<div>transformed</div>');
    });

    it('switches subscription on prop change', function () {
      const storeA = {value: 'untouched'};
      const storeB = {value: 'untouched'};
      const wrapper = mountTest(connector('store')(ValueDiv), {store: storeA});
      assert.equal(wrapper.html(), '<div>untouched</div>');
      storeA.value = 'touched';
      zine.publish(storeA);
      assert.equal(wrapper.html(), '<div>touched</div>');
      wrapper.setProps({store: storeB});
      assert.equal(wrapper.html(), '<div>untouched</div>');
      storeB.value = 'touched';
      zine.publish(storeB);
      assert.equal(wrapper.html(), '<div>touched</div>');
      storeA.value = 'retouched';
      zine.publish(storeA);
      assert.equal(wrapper.html(), '<div>touched</div>'); // Doesn't change to "retouched"
    });
  });

  describe('react lifecycle tests', function () {
    it('unsubscribes before unmounting', function () {
      const store = {value: 'unused', renderChild: true};
      const Wrapped = connector(store)(ValueDiv);
      const ParentSubscriber = ({renderChild}) => <div>{renderChild && <Wrapped />}</div>;

      const wrapper = mountTest(connector(store)(ParentSubscriber));
      sinon.spy(console, 'error');
      store.renderChild = false;
      zine.publish(store);
      assert.isFalse(console.error.called);
    });

    it('renders as child without triggering parent re-render', function () {
      const Wrapped = connector('store')(ValueDiv);
      var renderCount = 0;
      const Parent = ({store}) => <div className={'parent ' + renderCount++}><Wrapped store={store} /></div>;

      const store = {value: 'untouched'};
      const wrapper = mountTest(Parent, {store});
      assert.equal(wrapper.html(), '<div class="parent 0"><div>untouched</div></div>');
      store.value = 'touched';
      zine.publish(store);
      assert.equal(wrapper.html(), '<div class="parent 0"><div>touched</div></div>');
    });

    it('creates independently reusable components', function () {
      const Wrapped = connector('store')(({id, value}) => <div className={`${id} ${value}`} />);
      const storeA = {value: 'untouched'};
      const storeB = {value: 'untouched'};

      const wrapper = mountTest(() => <div><Wrapped id='A' store={storeA} /><Wrapped id='B' store={storeB} /></div>);
      assert.equal(wrapper.html(), '<div><div class="A untouched"></div><div class="B untouched"></div></div>');
      storeA.value = 'touched';
      zine.publish(storeA);
      assert.equal(wrapper.html(), '<div><div class="A touched"></div><div class="B untouched"></div></div>');
      storeB.value = 'alsoTouched';
      zine.publish(storeB);
      assert.equal(wrapper.html(), '<div><div class="A touched"></div><div class="B alsoTouched"></div></div>');
    });
  });
});

// directConnector
describe('directConnector', function () {
  it('uses directFunctionalRenderer', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(directConnector(store)(
      (state, props) => render(state.value, props.secondValue)
    ), {secondValue: 'present'});
    assert.equal(wrapper.html(), '<div>untouched present</div>');
  });
});

// propInjector
describe('propInjector', function () {
  it('rejects invalid prop names', function () {
    [{}, () => 0, undefined, null, true, 1, Symbol()].forEach((type) => assert.throws(() => propInjector({}, type), Error, '', `[offending type: ${typeof type}]`));
  });

  it('rejects inappropriate transform functions', function () {
    [{}, null, true, 1, Symbol()].forEach((type) => assert.throws(() => propInjector({}, '', type), Error, '', `[offending type: ${typeof type}]`));
  });

  it('wraps default transform function', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(propInjector('store', 'store')(WrappedValueDiv), {store});
    assert.equal(wrapper.html(), '<div>untouched</div>');
    store.value = 'touched';
    zine.publish(store);
    assert.equal(wrapper.html(), '<div>touched</div>');
  });

  it('wraps custom transform function', function () {
    const store = {value: 'untouched'};
    const transform = (store) => (store.value == 'touched') ? {value: 'transformed'} : store;
    const wrapper = mountTest(propInjector('store', 'store', transform)(WrappedValueDiv), {store});
    assert.equal(wrapper.html(), '<div>untouched</div>');
    store.value = 'touched';
    zine.publish(store);
    assert.equal(wrapper.html(), '<div>transformed</div>');
  });
});

// propConnector
describe('propConnector', function () {
  it('works', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(propConnector('store')(WrappedValueDiv), {store});
    assert.equal(wrapper.html(), '<div>untouched</div>');
    store.value = 'touched';
    zine.publish(store);
    assert.equal(wrapper.html(), '<div>touched</div>');
  });
});

// createSubscriber
describe('createSubscriber', function () {
  it('accepts a single prop name', function () {
    const store = {value: 'untouched'};
    const wrapper = mountTest(createSubscriber('store', WrappedValueDiv), {store});
    assert.equal(wrapper.html(), '<div>untouched</div>');
    store.value = 'touched';
    zine.publish(store);
    assert.equal(wrapper.html(), '<div>touched</div>');
  });

  it('accepts multiple prop names', function () {
    const storeA = {value: 'untouched'};
    const storeB = {secondValue: 'alsoUntouched'};
    const wrapper = mountTest(createSubscriber(['storeA', 'storeB'], WrappedMultiValueDiv), {storeA, storeB});
    assert.equal(wrapper.html(), '<div>untouched alsoUntouched</div>');
    storeA.value = 'touched';
    zine.publish(storeA);
    assert.equal(wrapper.html(), '<div>touched alsoUntouched</div>');
    storeB.secondValue = 'alsoTouched';
    zine.publish(storeB);
    assert.equal(wrapper.html(), '<div>touched alsoTouched</div>');
  });
});
