import { DESKTOP_BREAKPOINT } from '../constants';
import useScreenWidth from './useScreenWidth';

/**
 * Subscribes to resize events on the page
 * to determine if the width is mobile or not
 * @deprecated use `!useScreenWidth(DESKTOP_BREAKPOINT)`
 */
export default function useMobile(): boolean {
  return !useScreenWidth(DESKTOP_BREAKPOINT);
}
