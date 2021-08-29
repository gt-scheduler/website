import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import swal from '@sweetalert/with-react';
import * as Sentry from '@sentry/react';
import Cookies from 'js-cookie';

import { classes } from '../../utils';
import { Header, Scheduler, Map, NavDrawer, NavMenu, Attribution } from '..';
import Feedback from '../Feedback';
import { Oscar } from '../../beans';
import { useCookieWithDefault, useJsonCookie, useMobile } from '../../hooks';
import {
  TermContext,
  TermContextValue,
  TermsContext,
  TermsContextValue,
  ThemeContext,
  ThemeContextValue
} from '../../contexts';
import { defaultTermData, isTheme } from '../../types';
import { ErrorWithFields, softError } from '../../log';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

const NAV_TABS = ['Scheduler', 'Map'];

export default function App(): React.ReactElement {
  const [terms, setTerms] = useState<string[]>([]);
  const [oscar, setOscar] = useState<Oscar | null>(null);

  // Persist the theme, term, and some term data as cookies
  const [theme, setTheme] = useCookieWithDefault('theme', 'dark');
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
  const themeContextValue = useMemo<ThemeContextValue>(
    () => [isTheme(theme) ? theme : 'dark', setTheme],
    [theme, setTheme]
  );
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
      { setTerm, setOscar, patchTermData }
    ],
    [term, oscar, filteredTermData, setTerm, setOscar, patchTermData]
  );

  // display popup when first visiting the site
  useEffect(() => {
    const cookieKey = 'visited-merge-notice';
    if (!Cookies.get(cookieKey)) {
      swal({
        button: 'Got It!',
        content: (
          <div>
            <img
              style={{ width: '175px' }}
              alt="GT Scheduler Logo"
              src="/mascot.png"
            />
            <h1>GT Scheduler</h1>
            <p>
              Hey there, yellow jackets!{' '}
              <a href="https://github.com/gt-scheduler">GT Scheduler</a> is a
              new collaboration between{' '}
              <a href="https://bitsofgood.org/">Bits of Good</a> and{' '}
              <a href="https://jasonpark.me/">Jason (Jinseo) Park</a> aimed at
              making class registration easier for everybody! Now, you can
              access course prerequisites, instructor GPAs, live seating
              information, and more all in one location.
            </p>
            <p>
              If you enjoy our work and are interested in contributing, feel
              free to{' '}
              <a href="https://github.com/gt-scheduler/website/pulls">
                open a pull request
              </a>{' '}
              with your improvements. Thank you and enjoy!
            </p>
          </div>
        )
      }).catch((err) => {
        softError(
          new ErrorWithFields({
            message: 'error with swal call',
            source: err,
            fields: {
              cookieKey
            }
          })
        );
      });

      Cookies.set(cookieKey, 'true', { expires: 365 });
    }
  }, []);

  // Fetch the current term's scraper information
  useEffect(() => {
    setOscar(null);
    if (term) {
      const url = `https://gt-scheduler.github.io/crawler/${term}.json`;
      axios
        .get(url)
        .then((res) => {
          const newOscar = new Oscar(res.data);
          setOscar(newOscar);
        })
        .catch((err) => {
          softError(
            new ErrorWithFields({
              message: 'error fetching crawler data',
              source: err,
              fields: {
                term,
                url
              }
            })
          );
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
        softError(
          new ErrorWithFields({
            message: 'error fetching list of terms',
            source: err,
            fields: {
              url
            }
          })
        );
      });
  }, [setTerms]);

  // Set the term to be the first one if it is unset
  // (once the terms load)
  useEffect(() => {
    if (term === '' && terms.length > 0) {
      const [recentTerm] = terms as [string];
      setTerm(recentTerm);
    }
  }, [terms, term, setTerm]);

  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = useMobile();
  const className = classes('App', mobile && 'mobile', theme);

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
    return <div className={className} />;
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <TermsContext.Provider value={termsContextValue}>
        <TermContext.Provider value={termContextValue}>
          <div className={classes('App', className)}>
            <Sentry.ErrorBoundary fallback="An error has occurred">
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
          </div>
        </TermContext.Provider>
      </TermsContext.Provider>
    </ThemeContext.Provider>
  );
}
