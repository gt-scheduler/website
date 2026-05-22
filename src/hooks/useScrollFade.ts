import { useEffect, useState } from 'react';

export default function useScrollFade(
  ref: React.RefObject<HTMLElement>,
  enabled: boolean
): { fadeLeft: boolean; fadeRight: boolean } {
  const [fadeLeft, setFadeLeft] = useState(false);
  const [fadeRight, setFadeRight] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const el = ref.current;
    if (!el) return;

    const update = (): void => {
      const { scrollLeft, scrollWidth, clientWidth } = el;
      const isOverflowing = scrollWidth > clientWidth;
      setFadeLeft(isOverflowing && scrollLeft > 0);
      setFadeRight(isOverflowing && scrollLeft + clientWidth < scrollWidth - 1);
    };

    update();
    el.addEventListener('scroll', update);
    window.addEventListener('resize', update);

    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, [enabled, ref]);

  return { fadeLeft, fadeRight };
}
