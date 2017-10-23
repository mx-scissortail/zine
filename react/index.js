'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.directFunctionalRenderer = directFunctionalRenderer;
exports.connector = connector;
exports.directConnector = directConnector;
exports.propInjector = propInjector;
exports.propConnector = propConnector;
exports.createSubscriber = createSubscriber;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _index = require('../index.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Subscriber = function (_React$Component) {
  _inherits(Subscriber, _React$Component);

  function Subscriber(props, spec, transform, component, subscription, renderer) {
    _classCallCheck(this, Subscriber);

    var _this = _possibleConstructorReturn(this, (Subscriber.__proto__ || Object.getPrototypeOf(Subscriber)).call(this, props));

    _this.subscriptionSpec = spec;
    _this.transform = transform;
    _this.component = component;
    _this.subscription = subscription;
    _this.render = renderer;
    _this.canUpdate = true;

    _this.update = function (value) {
      // value is only occasionally defined here, because of how zine.publish uses it as an optional second argument
      if (_this.canUpdate) {
        _this.setState({ data: _this.transform(_this.subscription, value) });
      }
    };

    if ((0, _index.publishable)(_this.subscription)) {
      (0, _index.subscribe)(_this.subscription, _this.update);
    } // TODO: add debug a warning when passing unpublishable value to subscription prop?

    _this.state = { data: transform(_this.subscription) };
    return _this;
  }

  _createClass(Subscriber, [{
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.canUpdate = false; // prevent updates from triggering re-renders after component decides to unmount
      (0, _index.unsubscribe)(this.subscription, this.update);
    }
  }]);

  return Subscriber;
}(_react2.default.Component);

// default renderer uses React.createElement


function defaultRenderer() {
  return _react2.default.createElement(this.component, Object.assign({}, this.props, this.state.data));
}

// direct functional renderer bypasses React.createElement - useful for when packing/unpacking props is useless
function directFunctionalRenderer() {
  return this.component(this.state.data, this.props);
}

var pass = function pass(sub) {
  return sub;
}; // default transform just merges the subscribed object into props

function verifyTransform(transform) {
  if (typeof transform !== 'function') {
    throw new TypeError('Can\'t create subscriber: transform must be a function, got ' + (transform === null ? 'null' : typeof transform === 'undefined' ? 'undefined' : _typeof(transform)));
  }
}

function connector(subscriptionSpec) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pass;

  verifyTransform(transform);
  if (typeof subscriptionSpec === 'string') {
    return function (component) {
      var renderer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultRenderer;
      return function (_Subscriber) {
        _inherits(_class, _Subscriber);

        function _class(props) {
          _classCallCheck(this, _class);

          return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).call(this, props, subscriptionSpec, transform, component, props[subscriptionSpec], renderer));
        }

        _createClass(_class, [{
          key: 'componentWillReceiveProps',
          value: function componentWillReceiveProps(nextProps) {
            var oldSubscription = this.props[this.subscriptionSpec];
            var subscription = this.subscription = nextProps[this.subscriptionSpec];
            if (subscription != oldSubscription) {
              (0, _index.unsubscribe)(oldSubscription, this.update);
              if ((0, _index.publishable)(subscription)) {
                (0, _index.subscribe)(subscription, this.update);
              } // TODO: add a debug warning when passing unpublishable value to subscription prop?
            }
            this.setState({ data: this.transform(subscription) });
          }
        }]);

        return _class;
      }(Subscriber);
    };
  } else if ((0, _index.publishable)(subscriptionSpec)) {
    return function (component) {
      var renderer = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : defaultRenderer;
      return function (_Subscriber2) {
        _inherits(_class2, _Subscriber2);

        function _class2(props) {
          _classCallCheck(this, _class2);

          return _possibleConstructorReturn(this, (_class2.__proto__ || Object.getPrototypeOf(_class2)).call(this, props, subscriptionSpec, transform, component, subscriptionSpec, renderer));
        }

        return _class2;
      }(Subscriber);
    };
  } else {
    throw new TypeError('connector(subscriptionSpec, transform): subscriptionSpec must be a string, object or function, got ' + (subscriptionSpec === null ? 'null' : typeof subscriptionSpec === 'undefined' ? 'undefined' : _typeof(subscriptionSpec)));
  }
}

function directConnector(subscriptionSpec, transform) {
  return function (component) {
    return connector(subscriptionSpec, transform)(component, directFunctionalRenderer);
  };
}

function propInjector(subscriptionSpec, prop) {
  var transform = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : pass;

  verifyTransform(transform);
  if (typeof prop !== 'string') {
    throw new TypeError('propInjector/propConnector: prop argument must be a string, got ' + (prop === null ? 'null' : typeof prop === 'undefined' ? 'undefined' : _typeof(prop)));
  }
  return connector(subscriptionSpec, function (sub, val) {
    return _defineProperty({}, prop, transform(sub, val));
  });
}

function propConnector(prop) {
  var transform = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : pass;

  return propInjector(prop, prop, transform);
}

function createSubscriber(propSpec, component) {
  return (Array.isArray(propSpec) ? propSpec : [propSpec]).reduce(function (comp, prop) {
    return propConnector(prop)(comp);
  }, component);
}
