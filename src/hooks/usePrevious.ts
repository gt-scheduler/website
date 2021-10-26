import { useRef, useEffect } from 'react';

/**
 * Gets the previous value of some parameter.
 * Taken from https://usehooks.com/usePrevious/.
 */
export default function usePrevious<T>(
  val: NonNullable<T>
): NonNullable<T> | null {
  const ref = useRef<NonNullable<T> | null>(null);
  useEffect(() => {
    ref.current = val;
  }, [val]);

  return ref.current;
}
