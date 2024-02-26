import React from 'react';
import { TooltipProvider } from 'react-tooltip';

import { classes } from '../../utils/misc';
import Feedback from '../Feedback';
import useBodyClass from '../../hooks/useBodyClass';
import { ThemeContext } from '../../contexts';
import ErrorBoundary from '../ErrorBoundary';
import { ReactErrorDetails } from '../ErrorDetails';
import ErrorDisplay from '../ErrorDisplay';
import ErrorHeader from '../ErrorHeader';
import { AppNavigation } from './navigation';
import AppDataLoader from '../AppDataLoader';
import { AppSkeleton, SkeletonContent, AppContent } from './content';
import useThemeFromStorage from '../../data/hooks/useThemeFromStorage';
import { DESKTOP_BREAKPOINT } from '../../constants';
import useScreenWidth from '../../hooks/useScreenWidth';
import InformationModal from '../InformationModal';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function App(): React.ReactElement {
  // Grab the current theme (light/dark) from local storage.
  // This hook returns the memoized context value.
  const themeContextValue = useThemeFromStorage();

  // Add the current theme as a class on the body element
  useBodyClass(themeContextValue[0]);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <AppCSSRoot>
        <TooltipProvider>
          {/* To bring the website down for maintenance purposes, 
            insert <Maintenance /> here and disable everything below.
            See https://github.com/gt-scheduler/website/pull/194 for reference. */}
          <ErrorBoundary
            fallback={(error, errorInfo): React.ReactElement => (
              <AppSkeleton>
                <SkeletonContent>
                  <ErrorHeader />
                  <ErrorDisplay
                    errorDetails={
                      <ReactErrorDetails error={error} errorInfo={errorInfo} />
                    }
                  >
                    <div>
                      There was en error somewhere in the core application logic
                      and it can&apos;t continue.
                    </div>
                    <div>
                      Try refreshing the page to see if it fixes the issue.
                    </div>
                  </ErrorDisplay>
                </SkeletonContent>
              </AppSkeleton>
            )}
          >
            <AppNavigation>
              {/* AppDataLoader is in charge of ensuring that there are valid values
                for the Terms and Term contexts before rendering its children.
                If any data is still loading,
                then it displays an "app skeleton" with a spinner.
                If there was an error while loading
                then it displays an error screen. */}
              <AppDataLoader>
                <AppContent />
              </AppDataLoader>
            </AppNavigation>
            <Feedback />

            {/* Display a popup when first visiting the site */}
            {/* Include <InformationModal /> or <MaintenanceModal /> here */}
            <InformationModal />
          </ErrorBoundary>
        </TooltipProvider>
      </AppCSSRoot>
    </ThemeContext.Provider>
  );
}

// Private sub-components

type AppCSSRootProps = {
  children?: React.ReactNode;
};

/**
 * Mounts the outer `div.App` that is used to control global CSS selectors
 * such as `.App.mobile`.
 */
function AppCSSRoot({ children }: AppCSSRootProps): React.ReactElement {
  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  return <div className={classes('App', mobile && 'mobile')}>{children}</div>;
}
