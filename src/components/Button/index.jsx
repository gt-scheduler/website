import React, { Component } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import { classes } from '../../utils';
import './stylesheet.scss';

class Button extends Component {
  render() {
    const { className, disabled, text, ...restProps } = this.props;

    const props = {
      className: classes('Button', className),
      ...restProps,
    };

    return disabled ? (
      <button className={props.className} disabled>
        {props.children}
      </button>
    ) : 'href' in props ? (
      <a {...props} rel="noopener noreferrer" target="_blank"/>
    ) : text ? (
      <CopyToClipboard text={text}>
        <div {...props}/>
      </CopyToClipboard>
    ) : (
      <button {...props} />
    );
  }
}

export default Button;
