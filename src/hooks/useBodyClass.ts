import { useLayoutEffect } from 'react';

/**
 * Adds the given class(es) to the HTML `body` element
 * when this hook runs.
 */
export default function useBodyClass(className: string | string[]): void {
  useLayoutEffect(() => {
    if (typeof className === 'string') {
      document.body.classList.add(className);
    } else {
      document.body.classList.add(...className);
    }

    return (): void => {
      if (typeof className === 'string') {
        document.body.classList.remove(className);
      } else {
        document.body.classList.remove(...className);
      }
    };
  }, [className]);
}
