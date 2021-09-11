import React, { useContext } from 'react';

import { Header, Scheduler, Attribution } from '..';
import { ReactErrorDetails } from '../ErrorDetails';
import ErrorDisplay from '../ErrorDisplay';
import ErrorHeader from '../ErrorHeader';
import ErrorBoundary from '../ErrorBoundary';
import HeaderDisplay from '../HeaderDisplay';
import Map from '../Map';
import { AppNavigationContext, AppMobileNav, NAV_TABS } from './navigation';
import { classes } from '../../utils/misc';

/**
 * Renders the actual content at the root of the app
 * once it has completely loaded state,
 * including headers & footers.
 */
export function AppContent(): React.ReactElement {
  const { currentTabIndex, setTabIndex, openDrawer } =
    useContext(AppNavigationContext);

  return (
    <>
      <AppMobileNav />
      <Header
        currentTab={currentTabIndex}
        onChangeTab={setTabIndex}
        onToggleMenu={openDrawer}
        tabs={NAV_TABS}
      />
      <ErrorBoundary
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
      </ErrorBoundary>
      <Attribution />
    </>
  );
}

export type AppSkeletonWithLoadingTermsProps = {
  children: React.ReactNode;
};

/**
 * Renders a non-functional "skeleton" of the app
 * that shows as much content as possible without needing valid context values.
 * The term select box is marked as loading and cannot be interacted with.
 */
export function AppSkeletonWithLoadingTerms({
  children,
}: AppSkeletonWithLoadingTermsProps): React.ReactElement {
  const { currentTabIndex, setTabIndex, openDrawer } =
    useContext(AppNavigationContext);

  return (
    <>
      <AppMobileNav />
      <HeaderDisplay
        currentTab={currentTabIndex}
        onChangeTab={setTabIndex}
        onToggleMenu={openDrawer}
        tabs={NAV_TABS}
        termsState={{ type: 'loading' }}
      />
      {children}
      <Attribution />
    </>
  );
}

export type AppSkeletonWithSwitchableTermsProps = {
  children: React.ReactNode;
  terms: string[];
  currentTerm: string;
  onChangeTerm: (next: string) => void;
};

/**
 * Renders a non-functional "skeleton" of the app
 * that shows as much content as possible without needing valid context values.
 * The term select box can be interacted with.
 */
export function AppSkeletonWithSwitchableTerms({
  children,
  terms,
  currentTerm,
  onChangeTerm,
}: AppSkeletonWithSwitchableTermsProps): React.ReactElement {
  const { currentTabIndex, setTabIndex, openDrawer } =
    useContext(AppNavigationContext);

  return (
    <>
      <AppMobileNav />
      <HeaderDisplay
        currentTab={currentTabIndex}
        onChangeTab={setTabIndex}
        onToggleMenu={openDrawer}
        tabs={NAV_TABS}
        termsState={{ type: 'loaded', terms, currentTerm, onChangeTerm }}
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
