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
  AppMobileNavDisplay,
  SchedulerPageType,
} from './navigation';
import { classes, shouldDisplayRatings } from '../../utils/misc';
import { AccountContext, AccountContextValue } from '../../contexts/account';
import { Term } from '../../types';
import CourseDetails from '../CourseDetails';
import SectionDetails from '../SectionDetails';
import RatingsPage from '../RatingsPage';
import RateBanner from '../RateBanner';
import useScreenWidth from '../../hooks/useScreenWidth';
import { DESKTOP_BREAKPOINT } from '../../constants';

export const WEB_NAV_TABS = ['Scheduler', 'Map', 'Finals'];

/**
 * Renders the actual content at the root of the app
 * once it has completely loaded state,
 * including headers & footers.
 * This component is memoized, so it only re-renders when its context changes.
 */
function AppContentBase(): React.ReactElement {
  const {
    currentTab,
    ratingsOverrideTerm,
    setTab,
    openDrawer,
    currentSchedulerPage,
  } = useContext(AppNavigationContext);
  const captureRef = useRef<HTMLDivElement>(null);
  const { type } = useContext(AccountContext);
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  return (
    <>
      <AppMobileNav captureRef={captureRef} />
      <Header
        minimal={currentTab === 'Ratings'}
        currentTab={currentTab}
        onChangeTab={setTab}
        onToggleMenu={openDrawer}
        tabs={WEB_NAV_TABS}
        captureRef={captureRef}
      />
      {currentTab !== 'Ratings' && <SurveyBanner />}
      {/* TODO: remove after testing */}
      {currentTab !== 'Ratings' && shouldDisplayRatings(!mobile, type) && (
        <RateBanner />
      )}
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
                {currentTab ?? '?'} tab and it can&apos;t continue.
              </div>
              <div>Try refreshing the page to see if it fixes the issue.</div>
            </ErrorDisplay>
          </SkeletonContent>
        )}
      >
        {currentTab === 'Scheduler' && <Scheduler />}
        {currentTab === 'Course details' &&
          (currentSchedulerPage.type === SchedulerPageType.SECTION_DETAILS ? (
            <SectionDetails courseId={currentSchedulerPage.courseId} />
          ) : (
            <CourseDetails />
          ))}
        {currentTab === 'Map' && <Map />}
        {currentTab === 'Finals' && <Finals />}
        {currentTab === 'Ratings' && (
          <RatingsPage overrideTerm={ratingsOverrideTerm} />
        )}
        {/* Fake calendar used to capture screenshots */}
        <div className="capture-container" ref={captureRef}>
          <Calendar className="fake-calendar" capture overlayCrns={[]} />
        </div>
      </ErrorBoundary>
      {currentTab !== 'Ratings' && <Attribution />}
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
  const { currentTab, setTab, openDrawer } = useContext(AppNavigationContext);

  return (
    <>
      <AppMobileNavDisplay />
      <HeaderDisplay
        currentTab={currentTab}
        onChangeTab={setTab}
        onToggleMenu={openDrawer}
        tabs={WEB_NAV_TABS}
        accountState={accountState ?? { type: 'loading' }}
        termsState={
          termsState == null
            ? { type: 'loading' }
            : { type: 'loaded', ...termsState }
        }
        versionsState={{ type: 'loading' }}
        paletteState={{ type: 'loading' }}
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
