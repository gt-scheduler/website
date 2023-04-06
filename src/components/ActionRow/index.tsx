import React from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { classes } from '../../utils/misc';
import Button, { ButtonProps } from '../Button';

import './stylesheet.scss';

type FontAwesomeProps = React.ComponentProps<typeof FontAwesomeIcon>;
export type Action = {
  icon: FontAwesomeProps['icon'];
  styling?: React.CSSProperties;
  id?: string;
  tooltip?: string;
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
}: ActionRowProps): React.ReactElement {
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
                  id,
                  tooltip,
                  onMouseEnter,
                  onMouseLeave,
                  ...rest
                },
                i
              ) => (
                <>
                  <Button className="action" {...rest} key={i}>
                    <FontAwesomeIcon
                      fixedWidth
                      style={styling}
                      icon={icon}
                      id={id}
                      onMouseEnter={onMouseEnter}
                      onMouseLeave={onMouseLeave}
                    />
                  </Button>
                  {tooltip && (
                    <ReactTooltip anchorId={id} variant="dark" place="left">
                      {tooltip}
                    </ReactTooltip>
                  )}
                </>
              )
            )}
        </div>
      </div>
      {children}
    </div>
  );
}
