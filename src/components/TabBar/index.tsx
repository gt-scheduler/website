import React, { useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

import useScrollFade from '../../hooks/useScrollFade';
import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type TabBarItem<K extends string> = {
  key: K;
  label: string;
  icon?: IconDefinition;
};

type TabBarProps<K extends string> = {
  className?: string;
  enableSelect?: boolean;
  items: readonly TabBarItem<K>[];
  selected?: TabBarItem<K>;
  onSelect?: (key: K) => void;
};

export default function TabBar<K extends string>({
  className,
  enableSelect = false,
  items,
  selected,
  onSelect,
}: TabBarProps<K>): React.ReactElement {
  const ref = useRef<HTMLDivElement>(null);
  const { fadeLeft, fadeRight } = useScrollFade(ref, enableSelect);

  const handleSelect = (key: K): void => {
    if (!enableSelect) return;
    onSelect?.(key);
  };

  return (
    <div className="TabBarContainer">
      {enableSelect && fadeLeft && <div className="fade-left" />}
      <div
        ref={ref}
        className={classes(
          'TabBar',
          !enableSelect && 'unselectable',
          className
        )}
      >
        {items.map((item) => {
          const isActive = selected?.key === item.key;
          return (
            <div
              key={item.key}
              className={classes('tab', enableSelect && isActive && 'active')}
              onClick={(): void => handleSelect(item.key)}
            >
              {item.icon && (
                <FontAwesomeIcon icon={item.icon} className="tab-icon" />
              )}
              <span className="tab-label">{item.label}</span>
            </div>
          );
        })}
      </div>
      {enableSelect && fadeRight && <div className="fade-right" />}
    </div>
  );
}
