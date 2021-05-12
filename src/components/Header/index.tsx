import React, { useContext, useMemo, useState } from 'react';
import 'react-virtualized/styles.css';
import './stylesheet.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBars } from '@fortawesome/free-solid-svg-icons';

import swal from 'sweetalert';
import Cookies from 'js-cookie';

import { getSemesterName } from '../../utils';
import { LARGE_MOBILE_BREAKPOINT, DESKTOP_BREAKPOINT } from '../../constants';
import { HeaderActionBar, Button, Select, Tab } from '..';
import { useScreenWidth } from '../../hooks';
import {
  ScheduleContext,
  TermsContext,
  ThemeContext,
  VersionsContext
} from '../../contexts';

export type HeaderProps = {
  currentTab: number;
  onChangeTab: (newTab: number) => void;
  onToggleMenu: () => void;
  tabs: string[];
  captureRef: React.RefObject<HTMLElement>;
};

/**
 * Renders the top header component,
 * and includes controls for top-level tab-based navigation
 */
const Header = ({
  currentTab,
  onChangeTab,
  onToggleMenu,
  tabs,
  captureRef
}: HeaderProps) => {
  const [
    { term, versionName, oscar, pinnedCrns },
    { setTerm, setVersionName }
  ] = useContext(ScheduleContext);
  const [terms] = useContext(TermsContext);
  const [versionLists, { patchVersionsData }] = useContext(VersionsContext);
  const versionList = versionLists[term];
  const [theme] = useContext(ThemeContext);
  const [versionIndex, setVersionIndex] = useState(
    versionList.indexOf(versionName)
  );
  const possibleVersions = [
    'Primary',
    'Secondary',
    'Tertiary',
    'Quaternary',
    'Quinary',
    'Senary',
    'Septenary',
    'Octonary',
    'Nonary',
    'Denary'
  ];

  // This function handles adding new versions to
  // versionLists state, versions cookie, incrementing
  // versionIndex state, and setting versionName state,
  // version cookie.
  // In other words, it adds versions based on how many version
  // you currently have, and set the current version to the new version.
  // There is a limit of 10 versions to be present for each term, the default
  // version names are [
  //     'Primary',
  //     'Secondary',
  //     'Tertiary',
  //     'Quaternary',
  //     'Quinary',
  //     'Senary',
  //     'Septenary',
  //     'Octonary',
  //     'Nonary',
  //     'Denary'
  //   ]
  const addVersion = () => {
    const vs = [...versionList];
    let cur = vs.length - 1;
    while (versionList.includes(possibleVersions[cur]) && cur <= 9) {
      cur += 1;
    } // this while loop finds the index of the next default version name that is not a duplicate
    // based on how many versions there are currently from a preset list.
    const nameToAdd = cur === 10 ? 'new version' : possibleVersions[cur];
    // if index is 10, meaning there are 9 versions and 'Denary' is used,
    // use 'new version' as the version name to be inserted instead
    vs.splice(vs.length - 1, 0, nameToAdd); // insert new version
    const patch = { ...versionLists };
    patch[term] = vs;
    patchVersionsData(patch); // create and send patch that includes the new version list.
    setVersionIndex(vs.length - 2); // set current index to new version
    setVersionName(vs[vs.length - 2]); // set current version name to new version
    if (versionIndex === 8) {
      vs.pop();
      patchVersionsData(patch);
    } // check if there are ten versions; if yes, remove 'new' as an option in the dropdown
  };

  const setVersionIndexBasedOnId = (text: string) => {
    const name = text.split(term)[1];
    setVersionIndex(versionList.indexOf(name));
    setVersionName(versionList[versionList.indexOf(name)]);
  };

  const totalCredits = useMemo(() => {
    return pinnedCrns.reduce((credits, crn) => {
      return credits + oscar.findSection(crn).credits;
    }, 0);
  }, [pinnedCrns, oscar]);

  // Re-render when the page is re-sized to become mobile/desktop
  // (desktop is >= 1024 px wide)
  const mobile = !useScreenWidth(DESKTOP_BREAKPOINT);

  // Re-render when the page is re-sized to be small mobile vs. greater
  // (small mobile is < 600 px wide)
  const largeMobile = useScreenWidth(LARGE_MOBILE_BREAKPOINT);
  return (
    <div className="Header">
      {/* Menu button, only displayed on mobile */}
      {mobile && (
        <Button className="nav-menu-button" onClick={onToggleMenu}>
          <FontAwesomeIcon className="icon" fixedWidth icon={faBars} />
        </Button>
      )}

      {/* Left-aligned logo */}
      <Button className="logo">
        <span className="gt">GT </span>
        <span className="scheduler">Scheduler</span>
      </Button>

      {/* Term selector */}
      <Select
        value={term}
        options={terms.map((currentTerm) => ({
          optionId: currentTerm,
          optionLabel: getSemesterName(currentTerm),
          onClick: (t: string) => {
            setVersionIndex(0);
            setVersionName(versionLists[t][0]);
            setTerm(t);
          }
        }))}
        className="semester"
      />

      {/* Version selector */}
      <Select
        value={term.concat(versionList[versionIndex])}
        desiredItemWidth={240}
        options={versionList.map((currentVersion, index) => ({
          optionId: term.concat(currentVersion),
          optionLabel: currentVersion,
          onClick:
            currentVersion === 'New' ? addVersion : setVersionIndexBasedOnId,
          iconsAndFunctions:
            currentVersion === 'New'
              ? { icons: ['add'], functions: [null] }
              : {
                  icons:
                    versionList.length === 2 ? ['edit'] : ['edit', 'delete'],
                  functions: {
                    edit: (name: string) => {
                      if (name === versionList[index]) {
                        return false;
                      }
                      if (versionList.includes(name)) {
                        swal({
                          className: `${theme}`,
                          text: 'Same version name already in use!'
                        });
                        return false;
                      }
                      const patch = { ...versionLists };
                      patch[term] = versionList.map((item, i) => {
                        if (i === index) {
                          return name;
                        }
                        return item;
                      });
                      patchVersionsData(patch);
                      const data = Cookies.get(term.concat(versionList[index]));
                      if (data) {
                        Cookies.set(term.concat(name), data);
                        Cookies.remove(term.concat(versionList[index]));
                      }
                      if (index === versionIndex) {
                        setVersionName(name);
                      }
                      return true;
                    },
                    delete:
                      versionList.length === 2
                        ? null
                        : () => {
                            swal({
                              buttons: ['Cancel', 'Delete'],
                              className: `${theme}`,
                              text: `Are you sure you want to delete "${versionList[index]}" schedule?`
                            }).then((val) => {
                              if (val) {
                                const newList = versionList.filter(
                                  (item, i) => {
                                    return i !== index;
                                  }
                                );
                                const patch = { ...versionLists };
                                patch[term] =
                                  versionList[versionList.length - 1] !== 'New'
                                    ? newList.concat(['New'])
                                    : newList;
                                const data = Cookies.get(
                                  term.concat(versionList[index])
                                );
                                if (data) {
                                  Cookies.remove(
                                    term.concat(versionList[index])
                                  );
                                }
                                patchVersionsData(patch);
                                const next =
                                  index <= versionIndex && versionIndex > 0
                                    ? versionIndex - 1
                                    : versionIndex;
                                setVersionIndex(next);
                                setVersionName(newList[next]);
                              }
                            });
                          }
                  }
                }
        }))}
        className="version"
      />

      <span className="credits">{totalCredits} Credits</span>

      {/* Include middle-aligned tabs on desktop */}
      {!mobile && (
        <div className="tabs">
          {tabs.map((tabLabel, tabIdx) => (
            <Tab
              key={tabIdx}
              active={tabIdx === currentTab}
              onClick={() => onChangeTab(tabIdx)}
              label={tabLabel}
            />
          ))}
        </div>
      )}

      {/* Include action bar on large mobile and higher */}
      {largeMobile && <HeaderActionBar captureRef={captureRef} />}
    </div>
  );
};

export default Header;
