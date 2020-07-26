import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { classes, isMobile } from '../../utils';
import { Button, Calendar, CombinationContainer, CourseContainer, Header } from '../';
import { Oscar } from '../../beans';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { useCookie, useJsonCookie } from '../../hooks';
import { OverlayCrnsContext, TermContext, TermsContext, ThemeContext } from '../../contexts';

const defaultTermData = {
  desiredCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  colorMap: {},
  sortingOptionIndex: 0,
};

export function App(props) {
  const [theme, setTheme] = useCookie('theme', 'dark');
  const [term, setTerm] = useCookie('term');
  const [termData, patchTermData] = useJsonCookie(term, defaultTermData);
  const [terms, setTerms] = useState([]);
  const [oscar, setOscar] = useState(null);

  const [tabIndex, setTabIndex] = useState(0);
  const [mobile, setMobile] = useState(isMobile());
  const [overlayCrns, setOverlayCrns] = useState([]);

  const themeContextValue = useMemo(() => [
    theme,
    setTheme,
  ], [theme, setTheme]);

  const termsContextValue = useMemo(() => [
    terms,
    setTerms,
  ], [terms, setTerms]);

  const termContextValue = useMemo(() => [
    { term, oscar, ...termData },
    { setTerm, setOscar, patchTermData },
  ], [term, oscar, termData, setTerm, setOscar, patchTermData]);

  const overlayContextValue = useMemo(() => [
    overlayCrns,
    setOverlayCrns,
  ], [overlayCrns, setOverlayCrns]);

  useEffect(() => {
    setOscar(null);
    if (term) {
      axios
        .get(`https://jasonpark.me/gt-schedule-crawler/${term}.json`)
        .then((res) => {
          const oscar = new Oscar(res.data);
          setOscar(oscar);
        });
    }
  }, [term]);

  useEffect(() => {
    axios
      .get('https://api.github.com/repos/64json/gt-schedule-crawler/contents?ref=gh-pages')
      .then((res) => {
        const terms = res.data
          .map(content => content.name)
          .filter(name => /\d{6}\.json/.test(name))
          .map(name => name.replace(/\.json$/, ''))
          .sort()
          .reverse();
        setTerms(terms);
      });
  }, [setTerms]);

  useEffect(() => {
    if (!term) {
      const [recentTerm] = terms;
      setTerm(recentTerm);
    }
  }, [terms, term, setTerm]);

  useEffect(() => {
    const handleResize = (e) => {
      const newMobile = isMobile();
      if (mobile !== newMobile) {
        setMobile(newMobile);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mobile]);

  const className = classes('App', mobile && 'mobile', theme);

  if (!oscar) {
    return (
      <div className={className}/>
    );
  }

  return (
    <ThemeContext.Provider value={themeContextValue}>
      <TermsContext.Provider value={termsContextValue}>
        <TermContext.Provider value={termContextValue}>
          <OverlayCrnsContext.Provider value={overlayContextValue}>
            <div className={className}>
              <Header/>
              {
                mobile && (
                  <div className="tab-container">
                    {['Courses', 'Combinations', 'Calendar'].map((tabTitle, i) => (
                      <Button key={tabTitle}
                              className={classes('tab', tabIndex === i && 'active')}
                              onClick={() => setTabIndex(i)}>
                        {tabTitle}
                      </Button>
                    ))}
                  </div>
                )
              }
              <div className="main">
                {
                  (!mobile || tabIndex === 0) &&
                  <CourseContainer/>
                }
                {
                  (!mobile || tabIndex === 1) &&
                  <CombinationContainer/>
                }
                {
                  (!mobile || tabIndex === 2) &&
                  <div className="calendar-container">
                    <Calendar className="calendar" overlayCrns={overlayCrns}/>
                  </div>
                }
              </div>
            </div>
          </OverlayCrnsContext.Provider>
        </TermContext.Provider>
      </TermsContext.Provider>
    </ThemeContext.Provider>
  );
}
