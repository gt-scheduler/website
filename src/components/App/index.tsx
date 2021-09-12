import React, { useEffect, useMemo } from 'react';

import { classes } from '../../utils/misc';
import Feedback from '../Feedback';
import useBodyClass from '../../hooks/useBodyClass';
import useCookie from '../../hooks/useCookie';
import useMobile from '../../hooks/useMobile';
import { ThemeContext, ThemeContextValue } from '../../contexts';
import { isTheme } from '../../types';
import { useInformationModal } from '../InformationModal';
import ErrorBoundary from '../ErrorBoundary';
import { ReactErrorDetails } from '../ErrorDetails';
import ErrorDisplay from '../ErrorDisplay';
import ErrorHeader from '../ErrorHeader';
import { AppNavigation } from './navigation';
import {
  LoadTerms,
  EnsureValidTerm,
  LoadOscarData,
  EnsureValidTermData,
  AppContextProvider,
} from './data';
import {
  AppSkeletonWithLoadingTerms,
  SkeletonContent,
  AppContent,
} from './content';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

export default function App(): React.ReactElement {
  // Display a popup when first visiting the site
  useInformationModal();

  return (
    <ThemeLoader>
      <AppCSSRoot>
        <ErrorBoundary
          fallback={(error, errorInfo): React.ReactElement => (
            <AppSkeletonWithLoadingTerms>
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
            </AppSkeletonWithLoadingTerms>
          )}
        >
          <AppNavigation>
            {/* LoadTerms is the start in a chain of components that handles
                loading all data for the app and controlling state
                (some of which is persisted in cookies).
                It allows for more explicit data flows and dependencies,
                and promotes better loading and error states/handling. */}
            <LoadTerms>
              {({ terms }): React.ReactNode => (
                <EnsureValidTerm terms={terms}>
                  {({ term, setTerm }): React.ReactNode => (
                    <LoadOscarData terms={terms} term={term} setTerm={setTerm}>
                      {({ oscar }): React.ReactNode => (
                        <EnsureValidTermData
                          terms={terms}
                          term={term}
                          setTerm={setTerm}
                          oscar={oscar}
                        >
                          {({ termData, patchSchedule }): React.ReactNode => (
                            <AppContextProvider
                              terms={terms}
                              term={term}
                              setTerm={setTerm}
                              oscar={oscar}
                              termData={termData}
                              patchSchedule={patchSchedule}
                            >
                              <AppContent />
                            </AppContextProvider>
                          )}
                        </EnsureValidTermData>
                      )}
                    </LoadOscarData>
                  )}
                </EnsureValidTerm>
              )}
            </LoadTerms>
          </AppNavigation>
          <Feedback />
        </ErrorBoundary>
      </AppCSSRoot>
    </ThemeLoader>
  );
}

// Private sub-components

type ThemeLoaderProps = {
  children: React.ReactNode;
};

/**
 * Provides the current UI theme to all children (via context),
 * ensuring that it is one of the valid values in `Theme`.
 */
function ThemeLoader({ children }: ThemeLoaderProps): React.ReactElement {
  const [theme, setTheme] = useCookie('theme', 'dark');
  const correctedTheme = isTheme(theme) ? theme : 'dark';

  // Ensure that the stored theme is valid; otherwise reset it
  useEffect(() => {
    if (theme !== correctedTheme) {
      setTheme(correctedTheme);
    }
  }, [theme, correctedTheme, setTheme]);

  const themeContextValue = useMemo<ThemeContextValue>(
    () => [correctedTheme, setTheme],
    [correctedTheme, setTheme]
  );

  // Add the current theme as a class on the body element
  useBodyClass(theme);

  return (
    <ThemeContext.Provider value={themeContextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

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
  const mobile = useMobile();

  return <div className={classes('App', mobile && 'mobile')}>{children}</div>;
}
