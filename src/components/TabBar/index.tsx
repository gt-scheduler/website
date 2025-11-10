import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type TabBarItem = {
  key: string;
  label: string;
};

type TabBarProps = {
  enableSelect?: boolean;
  items: TabBarItem[];
  selected?: TabBarItem;
  onSelect?: (key: string) => void;
};

export default function TabBar({
  enableSelect = false,
  items,
  selected,
  onSelect,
}: TabBarProps): React.ReactElement {
  return (
    <div className={classes('TabBar', !enableSelect && 'unselectable')}>
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
            {item.label}
          </div>
        );
      })}
    </div>
  );
}
