import React, { useRef, useState, useEffect } from 'react';
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
        className={classes('TabBar', !enableSelect && 'unselectable')}
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
              {item.label}
            </div>
          );
        })}
      </div>
      {enableSelect && fadeRight && <div className="fade-right" />}
    </div>
  );
}
