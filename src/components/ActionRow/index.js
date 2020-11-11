import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { classes } from '../../utils';
import './stylesheet.scss';
import { Button } from '..';

export default function ActionRow({
  className,
  label,
  children,
  actions,
  ...props
}) {
  return (
    <div className={classes('ActionRow', className)} {...props}>
      <div className="action-row-header">
        <div className="label">{label}</div>
        <div className={classes('actions', 'default')}>
          {actions
            .filter((action) => action)
            .map(
              (
                {
                  icon,
                  title,
                  styling,
                  dataTip,
                  dataFor,
                  onMouseEnter,
                  onMouseLeave,
                  ...restProps
                },
                i
              ) => (
                <Button className="action" {...restProps} key={i}>
                  <FontAwesomeIcon
                    fixedWidth
                    style={styling}
                    icon={icon}
                    title={title}
                    data-tip={dataTip}
                    data-for={dataFor}
                    onMouseEnter={onMouseEnter}
                    onMouseLeave={onMouseLeave}
                  />
                </Button>
              )
            )}
        </div>
      </div>
      {children}
    </div>
  );
}
