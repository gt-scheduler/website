import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { classes } from '../../utils';
import { Header, Scheduler, Map, Comparison } from '..';
import { Oscar } from '../../beans';
import { useCookie, useJsonCookie, useMobile } from '../../hooks';
import { TermContext, TermsContext, ThemeContext } from '../../contexts';

import 'react-virtualized/styles.css';
import './stylesheet.scss';

const defaultTermData = {
  desiredCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  colorMap: {},
  sortingOptionIndex: 0
};

const App = () => {
  const [terms, setTerms] = useState([]);
  const [oscar, setOscar] = useState(null);

  // Persist the theme, term, and some term data as cookies
  const [theme, setTheme] = useCookie('theme', 'dark');
  const [term, setTerm] = useCookie('term');
  const [termData, patchTermData] = useJsonCookie(term, defaultTermData);

  // Memoize context values so that their references are stable
  const themeContextValue = useMemo(() => [theme, setTheme], [theme, setTheme]);
  const termsContextValue = useMemo(() => [terms, setTerms], [terms, setTerms]);
  const termContextValue = useMemo(
    () => [
      { term, oscar, ...termData },
      { setTerm, setOscar, patchTermData }
    ],
    [term, oscar, termData, setTerm, setOscar, patchTermData]
  );

  // Fetch the current term's scraper information
  useEffect(() => {
    setOscar(null);
    if (term) {
      axios
        .get(`https://gtbitsofgood.github.io/gt-schedule-crawler/${term}.json`)
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
        'https://api.github.com/repos/GTBitsOfGood/gt-schedule-crawler/contents?ref=gh-pages'
      )
      .then((res) => {
        const newTerms = res.data
          .map((content) => content.name)
          .filter((name) => /\d{6}\.json/.test(name))
          .map((name) => name.replace(/\.json$/, ''))
          .sort()
          .reverse();
        setTerms(newTerms);
      });
  }, [setTerms]);

  // Set the term to be the first one if it is unset
  // (once the terms load)
  useEffect(() => {
    if (!term) {
      const [recentTerm] = terms;
      setTerm(recentTerm);
    }
  }, [terms, term, setTerm]);

  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = useMobile();
  const className = classes('App', mobile && 'mobile', theme);

  // Allow top-level tab-based navigation
  const [currentTabIndex, setTabIndex] = useState(0);

  // If the scraped JSON hasn't been loaded,
  // then show an empty div as a loading intermediate
  if (!oscar) {
    return <div className={className} />;
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <TermsContext.Provider value={termsContextValue}>
        <TermContext.Provider value={termContextValue}>
          <div className={className}>
            {/* The header controls top-level navigation
            and is always present */}
            <Header
              currentTab={currentTabIndex}
              onChangeTab={setTabIndex}
              tabs={['Scheduler', 'Map', 'Comparison']}
            />
            {currentTabIndex === 0 && <Scheduler />}
            {currentTabIndex === 1 && <Map />}
            {currentTabIndex === 2 && <Comparison />}
          </div>
        </TermContext.Provider>
      </TermsContext.Provider>
    </ThemeContext.Provider>
  );
};

export default App;
