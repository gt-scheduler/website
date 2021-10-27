import useMedia from './useMedia';

/**
 * Gets whether the screen is currently larger than the specified width.
 * Runs internally as a layout effect.
 * @param width The target screen width, as a number (pixels)
 * or as a CSS unit expression.
 * @returns Whether the screen is larger than the width
 */
export default function useScreenWidth(width: number | string): boolean {
  const widthWithUnits = typeof width === 'number' ? `${width}px` : width;
  return useMedia(`(min-width: ${widthWithUnits})`);
}
