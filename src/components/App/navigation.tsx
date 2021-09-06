import React, {
  useState,
  useCallback,
  useEffect,
  useMemo,
  useContext,
} from 'react';

import { NavDrawer, NavMenu } from '..';
import { useMobile } from '../../hooks';
import { ErrorWithFields } from '../../log';

export const NAV_TABS = ['Scheduler', 'Map'];

export type AppNavigationProps = {
  children: React.ReactNode;
};

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

/**
 * Handles controlling the state of app navigation,
 * including the drawer and top-level tabs
 */
export function AppNavigation({
  children,
}: AppNavigationProps): React.ReactElement {
  const mobile = useMobile();

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

/**
 * Adds the nav drawer that is conditionally open depending on navigation state
 * when the app is running on a mobile device
 */
export function AppMobileNav(): React.ReactElement | null {
  const mobile = useMobile();
  const { currentTabIndex, setTabIndex, isDrawerOpen, closeDrawer } =
    useContext(AppNavigationContext);

  if (!mobile) return null;

  return (
    <NavDrawer open={isDrawerOpen} onClose={closeDrawer}>
      <NavMenu
        items={NAV_TABS}
        currentItem={currentTabIndex}
        onChangeItem={setTabIndex}
      />
    </NavDrawer>
  );
}
