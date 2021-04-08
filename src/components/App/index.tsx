import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import axios from 'axios';
import swal from '@sweetalert/with-react';
import * as Sentry from '@sentry/react';
import Cookies from 'js-cookie';
import { classes } from '../../utils';
import {
  Header,
  Scheduler,
  Map,
  NavDrawer,
  NavMenu,
  Attribution,
  HeaderActionBar,
  Calendar
} from '..';
import Feedback from '../Feedback';
import { Oscar } from '../../beans';
import {
  useCookie,
  useJsonCookie,
  useMobile,
  useScreenWidth
} from '../../hooks';
import {
  ScheduleContext,
  ScheduleContextValue,
  TermsContext,
  TermsContextValue,
  ThemeContext,
  ThemeContextValue,
  VersionsContext,
  VersionsContextValue
} from '../../contexts';
import { defaultScheduleData, Theme } from '../../types';
import { LARGE_MOBILE_BREAKPOINT } from '../../constants';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

const NAV_TABS = ['Scheduler', 'Map'];

const App = () => {
  const [termsToCheck] = useState(['202008', '202102', '202105', '202108']);
  const [terms, setTerms] = useState<string[]>([]);
  const [oscar, setOscar] = useState<Oscar | null>(null);

  // Persist the theme, term, versions, and some schedule data as cookies
  const [theme, setTheme] = useCookie('theme', 'dark');
  const [term, setTerm] = useCookie('term');
  const [versionLists, patchVersionsData] = useJsonCookie('versions');
  const [versionName, setVersionName] = useCookie('version');
  const [scheduleData, patchScheduleData] = useJsonCookie(
    term ? term.concat(versionName) : ''.concat(versionName),
    defaultScheduleData
  );

  // Only consider courses and CRNs that exist
  // (fixes issues where a CRN/course is removed from Oscar
  // after a schedule was made with them)
  const filteredScheduleData = useMemo(() => {
    const courseFilter = (courseId: string) =>
      oscar != null && oscar.findCourse(courseId) != null;
    const crnFilter = (crn: string) =>
      oscar != null && oscar.findSection(crn) != null;

    const desiredCourses = scheduleData.desiredCourses.filter(courseFilter);
    const pinnedCrns = scheduleData.pinnedCrns.filter(crnFilter);
    const excludedCrns = scheduleData.excludedCrns.filter(crnFilter);

    return { ...scheduleData, desiredCourses, pinnedCrns, excludedCrns };
  }, [oscar, scheduleData]);

  // Memoize context values so that their references are stable
  const themeContextValue = useMemo<ThemeContextValue>(
    () => [theme as Theme, setTheme],
    [theme, setTheme]
  );
  const termsContextValue = useMemo<TermsContextValue>(
    () => [terms as string[], setTerms],
    [terms, setTerms]
  );
  const scheduleContextValue = useMemo<ScheduleContextValue>(
    () => [
      { term, versionName, oscar, ...filteredScheduleData },
      { setTerm, setVersionName, setOscar, patchScheduleData }
    ],
    [
      term,
      versionName,
      oscar,
      filteredScheduleData,
      setTerm,
      setVersionName,
      setOscar,
      patchScheduleData
    ]
  );
  const versionsContextValue = useMemo<VersionsContextValue>(
    () => [{ ...versionLists }, { patchVersionsData }],
    [versionLists, patchVersionsData]
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
      });

      Cookies.set(cookieKey, 'true', { expires: 365 });
    }
  }, []);

  // Fetch the current term's scraper information
  useEffect(() => {
    setOscar(null);
    if (term) {
      axios
        .get(`https://gt-scheduler.github.io/crawler/${term}.json`)
        .then((res) => {
          const newOscar = new Oscar(res.data);
          setOscar(newOscar);
        });
    }
  }, [term]);

  // Fetch all terms via the GitHub API
  useEffect(() => {
    axios
      .get(
        'https://api.github.com/repos/gt-scheduler/crawler/contents?ref=gh-pages'
      )
      .then((res) => {
        const newTerms = (res.data as { name: string }[])
          .map((content) => content.name)
          .filter((name: string) => /\d{6}\.json/.test(name))
          .map((name: string) => name.replace(/\.json$/, ''))
          .sort()
          .reverse();
        setTerms(newTerms);
      });
  }, [setTerms]);

  // Set the term to be the first one if it is unset
  // (once the terms load)
  useEffect(() => {
    const term_from_cookie = Cookies.get('term');
    if (!term && (!term_from_cookie || term_from_cookie === 'undefined')) {
      const [recentTerm] = terms;
      setTerm(recentTerm);
    } else if (term_from_cookie && term_from_cookie !== 'undefined') {
      setTerm(term_from_cookie);
    }
  }, [terms, term, setTerm]);

  // Initialize the versionName to Primary
  useEffect(() => {
    const v = Cookies.get('version');
    if (!versionName) {
      setVersionName(v || 'Primary');
    }
  }, [versionName, setVersionName]);

  // Initialize the version lists for each term
  useEffect(() => {
    const vs = Cookies.get('versions');
    if (!vs || vs === '{}') {
      patchVersionsData(
        terms.reduce((ac, cur) => ({ ...ac, [cur]: ['Primary', 'New'] }), {})
      );
    }
  }, [patchVersionsData, terms]);

  // Check for new terms
  // if there are new terms, initialize new version lists
  useEffect(() => {
    if (typeof versionLists === 'object' && terms.length !== 0) {
      const terms_in_cookie = Object.keys(versionLists);
      if (terms_in_cookie.length !== terms.length) {
        const missing_terms = terms.filter((x) => !terms_in_cookie.includes(x));
        patchVersionsData(
          Object.assign(
            versionLists,
            missing_terms.reduce(
              (ac, cur) => ({ ...ac, [cur]: ['Primary', 'New'] }),
              {}
            )
          )
        );
      }
    }
  }, [patchVersionsData, terms, versionLists]);

  // Backward compatibility for schedule data before version switch
  // implementation.
  // Copy the old cookies to match with the new cookies' naming format.
  // Checks for term 202008, 202102, 202105, 202108 at the time of
  // implementation.
  // Does not remove the old cookies.
  useEffect(() => {
    for (let x = 0; x < termsToCheck.length; x += 1) {
      const old_cookie = Cookies.get(termsToCheck[x]);
      const new_cookie = Cookies.get(termsToCheck[x].concat('Primary'));
      if (old_cookie && !new_cookie) {
        Cookies.set(termsToCheck[x].concat('Primary'), old_cookie);
      }
    }
  }, [termsToCheck]);

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

  const largeMobile = useScreenWidth(LARGE_MOBILE_BREAKPOINT);

  // Create the ref to the DOM element containing the fake calendar
  const captureRef = useRef(null);

  // If the scraped JSON hasn't been loaded,
  // then show an empty div as a loading intermediate
  if (!oscar) {
    return <div className={className} />;
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <VersionsContext.Provider value={versionsContextValue}>
        <TermsContext.Provider value={termsContextValue}>
          <ScheduleContext.Provider value={scheduleContextValue}>
            <div className={classes('App', className)}>
              <Sentry.ErrorBoundary fallback="An error has occurred">
                {/* On mobile, show the nav drawer + overlay */}
                {mobile && (
                  <NavDrawer open={isDrawerOpen} onClose={closeDrawer}>
                    {/* On small mobile devices, show the header action row */}
                    {!largeMobile && (
                      <HeaderActionBar
                        captureRef={captureRef}
                        style={{ minHeight: 64 }}
                      />
                    )}

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
                  captureRef={captureRef}
                />
                {currentTabIndex === 0 && <Scheduler />}
                {currentTabIndex === 1 && <Map />}

                {/* Fake calendar used to capture screenshots */}
                <div className="capture-container" ref={captureRef}>
                  {/* TODO remove once Calendar gets typing */}
                  {/*
                    // @ts-ignore */}
                  <Calendar className="fake-calendar" capture />
                </div>
                <Feedback />
              </Sentry.ErrorBoundary>
              <Attribution />
            </div>
          </ScheduleContext.Provider>
        </TermsContext.Provider>
      </VersionsContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
