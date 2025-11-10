import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type FontAwesomeProps = React.ComponentProps<typeof FontAwesomeIcon>;

export type TabBarItem = {
  key: string;
  label: string;
  icon?: FontAwesomeProps['icon'];
};

type TabBarProps = {
  className?: string;
  enableSelect?: boolean;
  items: TabBarItem[];
  selected?: TabBarItem;
  onSelect?: (key: string) => void;
};

export default function TabBar({
  className,
  enableSelect = false,
  items,
  selected,
  onSelect,
}: TabBarProps): React.ReactElement {
  return (
    <div
      className={classes('TabBar', !enableSelect && 'unselectable', className)}
    >
      {items.map((item) => {
        const isActive = selected?.key === item.key;
        return (
          <div
            key={item.key}
            className={classes('tab', enableSelect && isActive && 'active')}
            onClick={(): void => {
              if (enableSelect && onSelect) onSelect(item.key);
            }}
          >
            {item.icon && (
              <FontAwesomeIcon icon={item.icon} className="tab-icon" />
            )}
            <span className="tab-label">{item.label}</span>
          </div>
        );
      })}
    </div>
  );
}
