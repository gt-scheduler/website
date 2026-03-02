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

export const MOBILE_NAV_TABS = ['Scheduler', 'Course details', 'Map', 'Finals'];

export enum SchedulerPageType {
  CALENDAR = 'calendar',
  COURSE_DETAILS = 'course-details',
  SECTION_DETAILS = 'section-details',
}

export type SchedulerPageState =
  | { type: SchedulerPageType.CALENDAR }
  | { type: SchedulerPageType.COURSE_DETAILS }
  | { type: SchedulerPageType.SECTION_DETAILS; courseId: string };

export type AppNavigationContextValue = {
  currentTab: string;
  setTab: (next: string, options?: { overrideTerm?: string }) => void;
  ratingsOverrideTerm: string | undefined;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  currentSchedulerPage: SchedulerPageState;
  setCurrentSchedulerPage: (page: SchedulerPageState) => void;
};

export const AppNavigationContext =
  React.createContext<AppNavigationContextValue>({
    currentTab: 'Scheduler',
    setTab: (): void => {
      throw new ErrorWithFields({
        message: 'empty AppNavigationContext.setTab value being used',
      });
    },
    ratingsOverrideTerm: undefined,
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
    currentSchedulerPage: { type: SchedulerPageType.CALENDAR },
    setCurrentSchedulerPage: (): void => {
      throw new ErrorWithFields({
        message:
          'empty AppNavigationContext.setCurrentSchedulerPage value being used',
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
  const [currentTab, setCurrentTab] = useState<string>('Scheduler');
  const [ratingsOverrideTerm, setRatingsOverrideTerm] = useState<
    string | undefined
  >(undefined);

  const setTab = useCallback(
    (next: string, options?: { overrideTerm?: string }): void => {
      setCurrentTab(next);
      // Clear the override whenever we leave the Ratings tab, and set it when
      // navigating to Ratings with an explicit prior term.
      setRatingsOverrideTerm(
        next === 'Ratings' ? options?.overrideTerm : undefined
      );
    },
    []
  );

  const [currentSchedulerPage, setCurrentSchedulerPage] =
    useState<SchedulerPageState>({ type: SchedulerPageType.CALENDAR });
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
      currentTab,
      setTab,
      ratingsOverrideTerm,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      currentSchedulerPage,
      setCurrentSchedulerPage,
    }),
    [
      currentTab,
      setTab,
      ratingsOverrideTerm,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      currentSchedulerPage,
      setCurrentSchedulerPage,
    ]
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
  const { currentTab, setTab, isDrawerOpen, closeDrawer } =
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
        items={MOBILE_NAV_TABS}
        currentItem={currentTab}
        onChangeItem={(next): void => {
          setTab(next);
          closeDrawer();
        }}
      />
    </NavDrawer>
  );
}
