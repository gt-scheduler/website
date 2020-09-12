import React, { useCallback, useContext } from 'react';
import {
  faBan,
  faInfoCircle,
  faThumbtack,
  faTimes
} from '@fortawesome/free-solid-svg-icons';
import { classes, periodToString } from '../../utils';
import { ActionRow } from '..';
import './stylesheet.scss';
import { OverlayCrnsContext, TermContext } from '../../contexts';
import { DELIVERY_MODES } from '../../constants';

export function Section({ className, section, pinned, color }) {
  const [{ term, pinnedCrns, excludedCrns }, { patchTermData }] = useContext(
    TermContext
  );
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);

  const excludeSection = useCallback(
    (section) => {
      patchTermData({
        excludedCrns: [...excludedCrns, section.crn],
        pinnedCrns: pinnedCrns.filter((crn) => crn !== section.crn)
      });
    },
    [pinnedCrns, excludedCrns, patchTermData]
  );

  const pinSection = useCallback(
    (section) => {
      if (pinnedCrns.includes(section.crn)) {
        patchTermData({
          pinnedCrns: pinnedCrns.filter((crn) => crn !== section.crn)
        });
      } else {
        patchTermData({
          pinnedCrns: [...pinnedCrns, section.crn],
          excludedCrns: excludedCrns.filter((crn) => crn !== section.crn)
        });
      }
    },
    [pinnedCrns, excludedCrns, patchTermData]
  );

  return (
    <ActionRow
      label={section.id}
      className={classes('Section', className)}
      onMouseEnter={() => setOverlayCrns([section.crn])}
      onMouseLeave={() => setOverlayCrns([])}
      actions={[
        {
          icon: pinned ? faTimes : faThumbtack,
          onClick: () => pinSection(section)
        },
        {
          icon: faInfoCircle,
          href: `https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${section.crn}`
        },
        { icon: faBan, onClick: () => excludeSection(section) }
      ]}
      style={pinned ? { backgroundColor: color } : undefined}
    >
      <div className="section-details">
        <div className="delivery-mode">
          {DELIVERY_MODES[section.deliveryMode]}
        </div>
        <div className="meeting-container">
          {section.meetings.map((meeting, i) => {
            return (
              <div className="meeting" key={i}>
                <span className="days">{meeting.days.join('')}</span>
                <span className="period">{periodToString(meeting.period)}</span>
              </div>
            );
          })}
        </div>
      </div>
    </ActionRow>
  );
}
