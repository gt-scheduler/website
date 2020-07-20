import React, { Component } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { classes } from '../../utils';
import './stylesheet.scss';

class Button extends Component {
  render() {
    const { className, disabled, text, ...restProps } = this.props;

    const props = {
      className: classes('Button', disabled && 'disabled', className),
      ...restProps,
    };

    return disabled ? (
      <div className={props.className}>
        {props.children}
      </div>
    ) : 'href' in props ? (
      <a {...props} rel="noopener noreferrer" target="_blank"/>
    ) : text ? (
      <CopyToClipboard text={text}>
        <div {...props}/>
      </CopyToClipboard>
    ) : (
      <div {...props} />
    );
  }
}

export default Button;
