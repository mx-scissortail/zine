import React from 'react';
import {publishable, subscribe, unsubscribe} from '../index.js';

export class Connect extends React.Component {
  constructor(props) {
    super(props);
    this.canUpdate = true;

    this.update = () => {
      if (this.canUpdate) {
        this.forceUpdate();
      }
    };

    if (publishable(this.props.source)) {
      subscribe(this.props.source, this.update);
    } else {
      console.warn("Tried to use Connect to subscribe to an unpublishable source: ", this.props.source);
    }
  }

  componentWillUnmount () {
    this.canUpdate = false; // Prevent updates from triggering re-renders after component decides to unmount
    unsubscribe(this.props.source, this.update);
  }

  componentWillUpdate (nextProps) {
    let oldSource = this.props.source;
    let source = nextProps.source;
    if (source !== oldSource) {
      unsubscribe(oldSource, this.update);
      if (publishable(source)) {
        subscribe(source, this.update);
      } else {
        console.warn("Tried to use Connect to subscribe to an unpublishable source: ", source);
      }
    }
  }

  render () {
    return this.props.render(this.props.source, this.props.passProps);
  }
}

Connect.defaultProps = {
  passProps: {},
  render: () => null,
  source: undefined
}

export function connector (spec, render) {
  return (props) => <Connect source={spec} render={render} passProps={props} />;
}
