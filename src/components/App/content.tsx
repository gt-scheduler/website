import React, { useContext, useRef } from 'react';

import { Header, Scheduler, Attribution, Calendar } from '..';
import { ReactErrorDetails } from '../ErrorDetails';
import ErrorDisplay from '../ErrorDisplay';
import ErrorHeader from '../ErrorHeader';
import ErrorBoundary from '../ErrorBoundary';
import HeaderDisplay from '../HeaderDisplay';
import Map from '../Map';
import Finals from '../Finals';
import SurveyBanner from '../SurveyBanner';
import {
  AppNavigationContext,
  AppMobileNav,
  NAV_TABS,
  AppMobileNavDisplay,
} from './navigation';
import { classes } from '../../utils/misc';
import { AccountContextValue } from '../../contexts/account';
import { Term } from '../../types';

/**
 * Renders the actual content at the root of the app
 * once it has completely loaded state,
 * including headers & footers.
 * This component is memoized, so it only re-renders when its context changes.
 */
function AppContentBase(): React.ReactElement {
  const { currentTabIndex, setTabIndex, openDrawer } =
    useContext(AppNavigationContext);
  const captureRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <AppMobileNav captureRef={captureRef} />
      <Header
        currentTab={currentTabIndex}
        onChangeTab={setTabIndex}
        onToggleMenu={openDrawer}
        tabs={NAV_TABS}
        captureRef={captureRef}
      />
      <SurveyBanner />
      <ErrorBoundary
        // ErrorBoundary.fallback is a normal render prop, not a component.
        // eslint-disable-next-line react/no-unstable-nested-components
        fallback={(error, errorInfo): React.ReactElement => (
          <SkeletonContent>
            <ErrorHeader />
            <ErrorDisplay
              errorDetails={
                <ReactErrorDetails error={error} errorInfo={errorInfo} />
              }
            >
              <div>
                There was en error somewhere somewhere in the{' '}
                {NAV_TABS[currentTabIndex] ?? '?'} tab and it can&apos;t
                continue.
              </div>
              <div>Try refreshing the page to see if it fixes the issue.</div>
            </ErrorDisplay>
          </SkeletonContent>
        )}
      >
        {currentTabIndex === 0 && <Scheduler />}
        {currentTabIndex === 1 && <Map />}
        {currentTabIndex === 2 && <Finals />}
        {/* Fake calendar used to capture screenshots */}
        <div className="capture-container" ref={captureRef}>
          <Calendar className="fake-calendar" capture overlayCrns={[]} />
        </div>
      </ErrorBoundary>
      <Attribution />
    </>
  );
}

/**
 * Renders the actual content at the root of the app
 * once it has completely loaded state,
 * including headers & footers.
 * This component is memoized, so it only re-renders when its context changes.
 */
export const AppContent = React.memo(AppContentBase);

export type AppSkeletonProps = {
  children: React.ReactNode;
  accountState?: AccountContextValue;
  termsState?: {
    terms: Term[];
    currentTerm: string;
    onChangeTerm: (next: string) => void;
  };
};

/**
 * Renders a non-functional "skeleton" of the app
 * that shows as much content as possible without needing valid context values.
 * The optional props can be used
 * to selectively "enable" various parts of the app while it loads.
 */
export function AppSkeleton({
  children,
  accountState,
  termsState,
}: AppSkeletonProps): React.ReactElement {
  const { currentTabIndex, setTabIndex, openDrawer } =
    useContext(AppNavigationContext);

  return (
    <>
      <AppMobileNavDisplay />
      <HeaderDisplay
        currentTab={currentTabIndex}
        onChangeTab={setTabIndex}
        onToggleMenu={openDrawer}
        tabs={NAV_TABS}
        accountState={accountState ?? { type: 'loading' }}
        termsState={
          termsState == null
            ? { type: 'loading' }
            : { type: 'loaded', ...termsState }
        }
        versionsState={{ type: 'loading' }}
        skeleton
      />
      {children}
      <Attribution />
    </>
  );
}

export type SkeletonContentProps = {
  children: React.ReactNode;
};

/**
 * Parent component for any content rendered inside an app skeleton,
 * centering it horizontally and vertically
 * and allowing vertical overflow to be scrolled.
 */
export function SkeletonContent({
  children,
}: SkeletonContentProps): React.ReactElement {
  return (
    <div className={classes('main', 'skeleton')}>
      <div className="skeleton-content">
        <div className="skeleton-content-inner">{children}</div>
      </div>
    </div>
  );
}
