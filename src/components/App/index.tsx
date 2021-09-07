import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import * as Sentry from '@sentry/react';

import { classes, isAxiosNetworkError } from '../../utils';
import { Header, Scheduler, Map, NavDrawer, NavMenu, Attribution } from '..';
import Feedback from '../Feedback';
import { Oscar } from '../../beans';
import {
  useCookieWithDefault,
  useJsonCookie,
  useMobile,
  useBodyClass,
} from '../../hooks';
import {
  TermContext,
  TermContextValue,
  TermsContext,
  TermsContextValue,
  ThemeContext,
  ThemeContextValue,
} from '../../contexts';
import { defaultTermData, isTheme } from '../../types';
import { ErrorWithFields, softError } from '../../log';
import { useInformationModal } from '../InformationModal';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

const NAV_TABS = ['Scheduler', 'Map'];

/**
 * Determines if the given term is considered "valid";
 * helps to recover from invalid cookie values if possible.
 */
function isValidTerm(term: unknown): boolean {
  return (
    term != null &&
    typeof term === 'string' &&
    term !== '' &&
    term !== 'undefined'
  );
}

export default function App(): React.ReactElement {
  // Display a popup when first visiting the site
  useInformationModal();

  const [terms, setTerms] = useState<string[]>([]);
  const [oscar, setOscar] = useState<Oscar | null>(null);

  // Persist the term and term data as cookies
  const [term, setTerm] = useCookieWithDefault('term', '');
  const [termData, patchTermData] = useJsonCookie(term, defaultTermData);

  // Only consider courses and CRNs that exist
  // (fixes issues where a CRN/course is removed from Oscar
  // after a schedule was made with them)
  const filteredTermData = useMemo(() => {
    const courseFilter = (courseId: string): boolean =>
      oscar != null && oscar.findCourse(courseId) != null;
    const crnFilter = (crn: string): boolean =>
      oscar != null && oscar.findSection(crn) != null;

    const desiredCourses = termData.desiredCourses.filter(courseFilter);
    const pinnedCrns = termData.pinnedCrns.filter(crnFilter);
    const excludedCrns = termData.excludedCrns.filter(crnFilter);

    return { ...termData, desiredCourses, pinnedCrns, excludedCrns };
  }, [oscar, termData]);

  // Memoize context values so that their references are stable
  const termsContextValue = useMemo<TermsContextValue>(
    () => [terms, setTerms],
    [terms, setTerms]
  );
  const termContextValue = useMemo<TermContextValue>(
    () => [
      // We ensure that oscar is non-null when we give this to the context
      // provider, so while this is an unsafe cast we ensure the safety
      // manually.
      { term, oscar: oscar as Oscar, ...filteredTermData },
      { setTerm, setOscar, patchTermData },
    ],
    [term, oscar, filteredTermData, setTerm, setOscar, patchTermData]
  );

  // Fetch the current term's scraper information
  useEffect(() => {
    setOscar(null);
    if (isValidTerm(term)) {
      const url = `https://gt-scheduler.github.io/crawler/${term}.json`;
      axios
        .get(url)
        .then((res) => {
          const newOscar = new Oscar(res.data);
          setOscar(newOscar);
        })
        .catch((err) => {
          // TODO(jazevedo620) 09-05-2021: present this as a hard error to user
          // Ignore network errors
          if (!isAxiosNetworkError(err)) {
            softError(
              new ErrorWithFields({
                message: 'error fetching crawler data',
                source: err,
                fields: {
                  term,
                  url,
                },
              })
            );
          }
        });
    }
  }, [term]);

  // Fetch all terms via the GitHub API
  useEffect(() => {
    const url =
      'https://api.github.com/repos/gt-scheduler/crawler/contents?ref=gh-pages';
    axios
      .get(url)
      .then((res) => {
        const newTerms = (res.data as { name: string }[])
          .map((content) => content.name)
          .filter((name) => /\d{6}\.json/.test(name))
          .map((name) => name.replace(/\.json$/, ''))
          .sort()
          .reverse();
        setTerms(newTerms);
      })
      .catch((err) => {
        // TODO(jazevedo620) 09-05-2021: present this as a hard error to user
        // Ignore network errors
        if (!isAxiosNetworkError(err)) {
          softError(
            new ErrorWithFields({
              message: 'error fetching list of terms',
              source: err,
              fields: {
                url,
              },
            })
          );
        }
      });
  }, [setTerms]);

  // Set the term to be the first one if it is unset
  // (once the terms load)
  useEffect(() => {
    if (terms.length > 0 && !isValidTerm(term)) {
      const [recentTerm] = terms as [string];
      if (isValidTerm(recentTerm)) {
        setTerm(recentTerm);
      } else {
        // TODO(jazevedo620) 08-30-2021: present this as a hard error to user
        softError(
          new ErrorWithFields({
            message: 'most recent term is not valid; can not fallback',
            fields: {
              recentTerm,
              terms,
            },
          })
        );
      }
    }
  }, [terms, term, setTerm]);

  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
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

  // If the scraped JSON hasn't been loaded,
  // then show an empty div as a loading intermediate
  if (!oscar) {
    return (
      <ThemeLoader>
        <AppCSSRoot />
      </ThemeLoader>
    );
  }

  return (
    <ThemeLoader>
      <AppCSSRoot>
        <TermsContext.Provider value={termsContextValue}>
          <TermContext.Provider value={termContextValue}>
            <Sentry.ErrorBoundary fallback={<div>An error has occurred</div>}>
              {/* On mobile, show the nav drawer + overlay */}
              {mobile && (
                <NavDrawer open={isDrawerOpen} onClose={closeDrawer}>
                  <NavMenu
                    items={NAV_TABS}
                    currentItem={currentTabIndex}
                    onChangeItem={setTabIndex}
                  />
                </NavDrawer>
              )}
              {/* The header controls top-level navigation
                  and is always present */}
              <Header
                currentTab={currentTabIndex}
                onChangeTab={setTabIndex}
                onToggleMenu={openDrawer}
                tabs={NAV_TABS}
              />
              {currentTabIndex === 0 && <Scheduler />}
              {currentTabIndex === 1 && <Map />}
              <Feedback />
            </Sentry.ErrorBoundary>
            <Attribution />
          </TermContext.Provider>
        </TermsContext.Provider>
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
  const [theme, setTheme] = useCookieWithDefault('theme', 'dark');
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
