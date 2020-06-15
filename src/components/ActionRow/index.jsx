import React, { Component } from 'react';
import { classes } from '../../utils';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './stylesheet.scss';
import CopyToClipboard from 'react-copy-to-clipboard';

class ActionRow extends Component {
  render() {
    const { className, children, actions, color, ...restProps } = this.props;

    return (
      <div className={classes('ActionRow', className)} {...restProps}>
        {children}
        <div className={classes('actions', 'default')}>
          {actions
            .filter((action) => action)
            .map(({ className, icon, ...restProps }, i) => {
              const props = {
                key: i,
                className: classes('action', className),
                children: (
                  <div className="icon" style={{ backgroundColor: color }}>
                    <FontAwesomeIcon fixedWidth icon={icon} />
                  </div>
                ),
                ...restProps,
              };
              return 'href' in props ? (
                <a {...props} rel="noopener noreferrer" target="_blank" />
              ) : 'text' in props ? (
                <CopyToClipboard {...props} />
              ) : (
                <div {...props} />
              );
            })}
        </div>
      </div>
    );
  }
}

export default ActionRow;
