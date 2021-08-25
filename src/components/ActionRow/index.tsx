import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { classes } from '../../utils';
import Button, { ButtonProps } from '../Button';

import './stylesheet.scss';

type FontAwesomeProps = React.ComponentProps<typeof FontAwesomeIcon>;
export type Action = {
  icon: FontAwesomeProps['icon'];
  styling?: React.CSSProperties;
  dataTip?: string;
  dataFor?: string;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
} & Omit<ButtonProps, 'children'>;

type BaseActionRowProps = {
  label: string;
  actions: (Action | null | undefined)[];
  className?: string;
  children?: React.ReactNode;
};
export type ActionRowProps = BaseActionRowProps &
  Omit<React.HTMLAttributes<HTMLDivElement>, keyof BaseActionRowProps>;

export default function ActionRow({
  className,
  label,
  children,
  actions,
  ...restProps
}: ActionRowProps) {
  return (
    <div className={classes('ActionRow', className)} {...restProps}>
      <div className="action-row-header">
        <div className="label">{label}</div>
        <div className={classes('actions', 'default')}>
          {actions
            .flatMap((action) => (action != null ? [action] : []))
            .map(
              (
                {
                  icon,
                  styling,
                  dataTip,
                  dataFor,
                  onMouseEnter,
                  onMouseLeave,
                  ...rest
                },
                i
              ) => (
                <Button className="action" {...rest} key={i}>
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
              )
            )}
        </div>
      </div>
      {children}
    </div>
  );
}
