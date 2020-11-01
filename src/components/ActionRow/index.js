import React from 'react';
import { classes } from '../../utils';
import './stylesheet.scss';
import { Button } from '..';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export function ActionRow({
  className,
  label,
  children,
  actions,
  ...restProps
}) {
  return (
    <div className={classes('ActionRow', className)} {...restProps}>
      <div className="action-row-header">
        <div className="label">{label}</div>
        <div className={classes('actions', 'default')}>
          {actions
            .filter((action) => action)
            .map(({ icon, styling, dataTip, dataFor, onMouseEnter, onMouseLeave, ...restProps }, i) => (
              <Button className="action" {...restProps} key={i}>
                <FontAwesomeIcon
                  fixedWidth
                  style={styling}
                  icon={icon}
                  data-tip={dataTip}
                  data-for={dataFor}
                  onMouseEnter={onMouseEnter}
                  onMouseLeave={onMouseLeave}
                />
              </Button>
            ))}
        </div>
      </div>
      {children}
    </div>
  );
}
