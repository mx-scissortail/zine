// TODO: add propInjector tests
import React from 'react';
import {assert} from 'chai';
import {mount} from 'enzyme';
import sinon from 'sinon';
import createMockDOM from 'jsdom-global';

import * as zine from '../dist/index.js';
import {Connect, connector} from '../dist/Connect/index.js';

createMockDOM();

const render = (source, props) => (
  props.secondValue ? <div>{source.value} {props.secondValue}</div> : <div>{source.value}</div>
);

describe('zine (pub/sub core)', () => {
  describe('publishable', () => {
    it('accepts all publishable types', () => {
      [{}, () => 0].forEach((type) => assert.isTrue(zine.publishable(type), `[should accept type: ${typeof type}]`));
    });

    it('rejects all non-publishable types', () => {
      ["string", undefined, null, true, 1, Symbol()].forEach((type) => assert.isNotTrue(zine.publishable(type), `[should reject type: ${typeof type}]`));
    });
  });

  describe('publish/subscribe', () => {
    it('publishes updates to subscribers', () => {
      const callback = sinon.spy();
      const sub = {};
      zine.subscribe(sub, callback);
      zine.publish(sub);
      assert.isTrue(callback.calledOnce);
    });

    it('publishes optional value argument on update', () => {
      const callback = sinon.spy();
      const sub = {};
      zine.subscribe(sub, callback);
      zine.publish(sub, 1);
      assert.isTrue(callback.calledWith(1));
    });

    it('stops publishing on unsubscribe', () => {
      const callback = sinon.spy();
      const sub = {};
      zine.subscribe(sub, callback);
      zine.publish(sub);
      zine.unsubscribe(sub, callback);
      zine.publish(sub);
      assert.isTrue(callback.calledOnce);
    });
  });

  describe('issue', () => {
    it('merges changes and publishes', () => {
      const callback = sinon.spy();
      const sub = {value: 0};
      zine.subscribe(sub, callback);
      zine.issue(sub, {value: 1});
      assert.isTrue(callback.calledOnce);
      assert.isTrue(sub.value === 1);
    });
  });
});

describe('zine/Connect (React wrappers)', () => {
  describe('Connect', () => {
    it('renders and passes props', () => {
      const store = {value: 'untouched'};
      const wrapper = mount(<Connect source={store} render={render} passProps={{secondValue: 'present'}} />);
      assert.equal(wrapper.html(), '<div>untouched present</div>');
    });

    it('re-renders on update', () => {
      const store = {value: 'untouched'};
      const wrapper = mount(<Connect source={store} render={render} />);
      assert.equal(wrapper.html(), '<div>untouched</div>');
      zine.issue(store, {value: 'touched'});
      assert.equal(wrapper.html(), '<div>touched</div>');
    });

    it('switches subscription on prop change', () => {
      const storeA = {value: 'untouched'};
      const storeB = {value: 'untouched'};
      const wrapper = mount(<Connect source={storeA} render={render} />);
      assert.equal(wrapper.html(), '<div>untouched</div>');
      zine.issue(storeA, {value: 'touched'});
      assert.equal(wrapper.html(), '<div>touched</div>');
      wrapper.setProps({source: storeB});
      assert.equal(wrapper.html(), '<div>untouched</div>');
      zine.issue(storeB, {value: 'touched'});
      assert.equal(wrapper.html(), '<div>touched</div>');
      zine.issue(storeA, {value: 'retouched'});
      assert.equal(wrapper.html(), '<div>touched</div>'); // Doesn't change to "retouched"
    });

    it('unsubscribes before unmounting', () => {
      const store = {value: 'untouched', renderChild: true};
      const parent = (store) => (
        <div>
        {store.renderChild && <Connect source={store} render={render} />}
        </div>
      );
      const wrapper = mount(<Connect source={store} render={parent} />);
      assert.equal(wrapper.html(), '<div><div>untouched</div></div>');
      sinon.spy(console, 'error');
      zine.issue(store, {renderChild: false});
      assert.isFalse(console.error.called);
      assert.equal(wrapper.html(), '<div></div>');
    });

    it('renders as child without triggering parent re-render', () => {
      var renderCount = 0;
      const store = {value: 'untouched'};
      const wrapper = mount(<div className={'parent ' + renderCount++}><Connect source={store} render={render} /></div>);
      assert.equal(wrapper.html(), '<div class="parent 0"><div>untouched</div></div>');
      zine.issue(store, {value: 'touched'});
      assert.equal(wrapper.html(), '<div class="parent 0"><div>touched</div></div>');
    });
  });

  describe('connector', () => {
    it('wraps Connect, renders and updates (passing props)', () => {
      const store = {value: 'untouched'};
      const Connected = connector(store, render);
      const wrapper = mount(<Connected secondValue='present'/>);
      assert.equal(wrapper.html(), '<div>untouched present</div>');
      zine.issue(store, {value: 'touched'});
      assert.equal(wrapper.html(), '<div>touched present</div>');
    });
  });
});
