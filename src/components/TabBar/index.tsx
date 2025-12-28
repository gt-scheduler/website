import React, { useRef, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconDefinition } from '@fortawesome/fontawesome-svg-core';

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
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  useEffect(() => {
    if (!enableSelect) return;
    const el = ref.current;
    if (!el) return;

    const checkScroll = (): void => {
      const isOverflowing = el.scrollWidth > el.clientWidth;
      const atStart = el.scrollLeft <= 0;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      setFadeLeft(isOverflowing && !atStart);
      setFadeRight(isOverflowing && !atEnd);
    };

    checkScroll();
    el.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    return () => {
      el.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, [items, enableSelect]);

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
              onClick={(): void => {
                if (enableSelect && onSelect) {
                  onSelect(item.key);
                }
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
      {enableSelect && fadeRight && <div className="fade-right" />}
    </div>
  );
}
