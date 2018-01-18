import {assert} from 'chai';
import sinon from 'sinon';

import * as zine from '../index.js';

describe('zine', () => {
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

    it('publishes subject and optional value argument on update', () => {
      const callback = sinon.spy();
      const sub = {};
      zine.subscribe(sub, callback);
      zine.publish(sub, 1);
      assert.isTrue(callback.calledWith(sub, 1));
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

    it('stops publishing on unsubscribeAll', () => {
      const callback = sinon.spy();
      const sub = {};
      zine.subscribe(sub, callback);
      zine.publish(sub);
      zine.unsubscribeAll(sub);
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
