import { Component } from 'react';
import { shallowCompareEntries } from '../../utils';

class SemiPureComponent extends Component {
  shouldComponentUpdate(nextProps, nextState) {
    const stateChanged = this.state !== nextState;
    const propsChanged = !shallowCompareEntries(this.props, nextProps);
    return stateChanged || propsChanged;
  }
}

export default SemiPureComponent;
