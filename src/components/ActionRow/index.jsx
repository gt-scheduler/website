import React, { Component } from 'react';
import { classes } from '../../utils';
import './stylesheet.scss';
import Button from '../Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

class ActionRow extends Component {
  render() {
    const { className, label, children, actions, ...restProps } = this.props;

    return (
      <div className={classes('ActionRow', className)} {...restProps}>
        <div className="action-row-header">
          <div className="label">
            {label}
          </div>
          <div className={classes('actions', 'default')}>
            {
              actions.filter(action => action).map(({ icon, ...restProps }, i) => (
                <Button className="action" {...restProps} key={i}>
                  <FontAwesomeIcon fixedWidth icon={icon}/>
                </Button>
              ))
            }
          </div>
        </div>
        {children}
      </div>
    );
  }
}

export default ActionRow;
