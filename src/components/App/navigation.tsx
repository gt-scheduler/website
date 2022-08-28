import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from 'react';

import { NavDrawer, NavMenu } from '..';
import { DESKTOP_BREAKPOINT, LARGE_MOBILE_BREAKPOINT } from '../../constants';
import useHeaderActionBarProps from '../../hooks/useHeaderActionBarProps';
import { AccountContextValue } from '../../contexts/account';
import useScreenWidth from '../../hooks/useScreenWidth';
import { ErrorWithFields } from '../../log';
import HeaderActionBar from '../HeaderActionBar';

export const NAV_TABS = ['Scheduler', 'Map', 'Finals'];

export type AppNavigationContextValue = {
  currentTabIndex: number;
  setTabIndex: (next: number) => void;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const AppNavigationContext =
  React.createContext<AppNavigationContextValue>({
    currentTabIndex: 0,
    setTabIndex: (): void => {
      throw new ErrorWithFields({
        message: 'empty AppNavigationContext.setTabIndex value being used',
      });
    },
    isDrawerOpen: false,
    openDrawer: (): void => {
      throw new ErrorWithFields({
        message: 'empty AppNavigationContext.openDrawer value being used',
      });
    },
    closeDrawer: (): void => {
      throw new ErrorWithFields({
        message: 'empty AppNavigationContext.closeDrawer value being used',
      });
    },
  });

export type AppNavigationProps = {
  children: React.ReactNode;
};

/**
 * Handles controlling the state of app navigation,
 * including the drawer and top-level tabs
 */
export function AppNavigation({
  children,
}: AppNavigationProps): React.ReactElement {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  // Allow top-level tab-based navigation
  const [currentTabIndex, setTabIndex] = useState(0);

  // Handle the status of the drawer being open on mobile
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  useEffect(() => {
    // Close the drawer if switching to desktop
    if (isDrawerOpen && !mobile) {
      setIsDrawerOpen(false);
    }
  }, [isDrawerOpen, mobile]);

  // Memoize the context value
  const contextValue = useMemo<AppNavigationContextValue>(
    () => ({
      currentTabIndex,
      setTabIndex,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
    }),
    [currentTabIndex, setTabIndex, isDrawerOpen, openDrawer, closeDrawer]
  );

  return (
    <AppNavigationContext.Provider value={contextValue}>
      {children}
    </AppNavigationContext.Provider>
  );
}

type AppMobileNavProps = {
  captureRef: React.RefObject<HTMLDivElement>;
};

/**
 * Adds the nav drawer that is conditionally open depending on navigation state
 * when the app is running on a mobile device.
 * Use over the "dumb" display AppMobileNavDisplay component
 * when the app data contexts are available.
 */
export function AppMobileNav({
  captureRef,
}: AppMobileNavProps): React.ReactElement {
  const headerActionBarProps = useHeaderActionBarProps(captureRef);
  return <AppMobileNavDisplay {...headerActionBarProps} />;
}

type AppMobileNavDisplayProps = {
  onCopyCrns?: () => void;
  enableCopyCrns?: boolean;
  onExportCalendar?: () => void;
  enableExportCalendar?: boolean;
  onDownloadCalendar?: () => void;
  enableDownloadCalendar?: boolean;
  accountState?: AccountContextValue | { type: 'loading' };
};

/**
 * Adds the nav drawer that is conditionally open depending on navigation state
 * when the app is running on a mobile device.
 * Runs as a "dumb" display component,
 * not needing valid values for the app data contexts.
 */
export function AppMobileNavDisplay({
  onCopyCrns = (): void => undefined,
  enableCopyCrns = false,
  onExportCalendar = (): void => undefined,
  enableExportCalendar = false,
  onDownloadCalendar = (): void => undefined,
  enableDownloadCalendar = false,
  accountState = { type: 'loading' },
}: AppMobileNavDisplayProps): React.ReactElement | null {
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);
  const largeMobile = useScreenWidth(LARGE_MOBILE_BREAKPOINT);
  const { currentTabIndex, setTabIndex, isDrawerOpen, closeDrawer } =
    useContext(AppNavigationContext);

  if (!mobile) return null;

  return (
    <NavDrawer open={isDrawerOpen} onClose={closeDrawer}>
      {/* On small mobile devices, show the header action row */}
      {!largeMobile && (
        <HeaderActionBar
          accountState={accountState}
          onCopyCrns={onCopyCrns}
          enableCopyCrns={enableCopyCrns}
          onExportCalendar={onExportCalendar}
          enableExportCalendar={enableExportCalendar}
          onDownloadCalendar={onDownloadCalendar}
          enableDownloadCalendar={enableDownloadCalendar}
        />
      )}

      <NavMenu
        items={NAV_TABS}
        currentItem={currentTabIndex}
        onChangeItem={setTabIndex}
      />
    </NavDrawer>
  );
}
