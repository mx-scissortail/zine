'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.Connect = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

exports.connector = connector;

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _index = require('../index.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Connect = exports.Connect = function (_React$Component) {
  _inherits(Connect, _React$Component);

  function Connect(props) {
    _classCallCheck(this, Connect);

    var _this = _possibleConstructorReturn(this, (Connect.__proto__ || Object.getPrototypeOf(Connect)).call(this, props));

    _this.canUpdate = true;

    _this.update = function () {
      if (_this.canUpdate) {
        _this.forceUpdate();
      }
    };

    if ((0, _index.publishable)(_this.props.source)) {
      (0, _index.subscribe)(_this.props.source, _this.update);
    } else {
      console.warn("Tried to use Connect to subscribe to an unpublishable source: ", _this.props.source);
    }
    return _this;
  }

  _createClass(Connect, [{
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      this.canUpdate = false; // Prevent updates from triggering re-renders after component decides to unmount
      (0, _index.unsubscribe)(this.props.source, this.update);
    }
  }, {
    key: 'componentWillUpdate',
    value: function componentWillUpdate(nextProps) {
      var oldSource = this.props.source;
      var source = nextProps.source;
      if (source !== oldSource) {
        (0, _index.unsubscribe)(oldSource, this.update);
        if ((0, _index.publishable)(source)) {
          (0, _index.subscribe)(source, this.update);
        } else {
          console.warn("Tried to use Connect to subscribe to an unpublishable source: ", source);
        }
      }
    }
  }, {
    key: 'render',
    value: function render() {
      return this.props.render(this.props.source, this.props.passProps);
    }
  }]);

  return Connect;
}(_react2.default.Component);

Connect.defaultProps = {
  passProps: {},
  render: function render() {
    return null;
  },
  source: undefined
};

function connector(spec, render) {
  return function (props) {
    return _react2.default.createElement(Connect, { source: spec, render: render, passProps: props });
  };
}
