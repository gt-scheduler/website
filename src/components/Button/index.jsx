import React, { Component } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { classes } from '../../utils';
import './stylesheet.scss';

class Button extends Component {
  render() {
    const { className, ...restProps } = this.props;

    const props = {
      className: classes('Button', className),
      ...restProps,
    };

    return 'href' in props ? (
      <a {...props}/>
    ) : 'text' in props ? (
      <CopyToClipboard {...props}/>
    ) : (
      <div {...props}/>
    );
  }
}


export default Button;
