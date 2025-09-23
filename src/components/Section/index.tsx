import React, { useCallback, useContext, useId } from 'react';
import {
  faBan,
  faChair,
  faThumbtack,
  faTimes,
} from '@fortawesome/free-solid-svg-icons';

import { classes, periodToString } from '../../utils/misc';
import { ActionRow } from '..';
import { OverlayCrnsContext, ScheduleContext } from '../../contexts';
import { DELIVERY_MODES } from '../../constants';
import { Section as SectionBean } from '../../data/beans';
import SeatInfo from '../SeatInfo';

import './stylesheet.scss';

export type SectionProps = {
  className?: string;
  section: SectionBean;
  pinned: boolean;
  color: string | undefined;
};

export default function Section({
  className,
  section,
  pinned,
  color,
}: SectionProps): React.ReactElement {
  const [{ term, pinnedCrns, excludedCrns }, { patchSchedule }] =
    useContext(ScheduleContext);
  const [, setOverlayCrns] = useContext(OverlayCrnsContext);

  const excludeSection = useCallback(
    (sect: SectionBean) => {
      patchSchedule({
        excludedCrns: [...excludedCrns, sect.crn],
        pinnedCrns: pinnedCrns.filter((crn) => crn !== sect.crn),
      });
    },
    [pinnedCrns, excludedCrns, patchSchedule]
  );

  const pinSection = useCallback(
    (sect: SectionBean) => {
      if (pinnedCrns.includes(sect.crn)) {
        patchSchedule({
          pinnedCrns: pinnedCrns.filter((crn) => crn !== sect.crn),
        });
      } else {
        patchSchedule({
          pinnedCrns: [...pinnedCrns, sect.crn],
          excludedCrns: excludedCrns.filter((crn) => crn !== sect.crn),
        });
      }
    },
    [pinnedCrns, excludedCrns, patchSchedule]
  );

  const excludeTooltipId = useId();
  return (
    <ActionRow
      label={section.id}
      className={classes('Section', className)}
      onMouseEnter={(): void => setOverlayCrns([section.crn])}
      onMouseLeave={(): void => setOverlayCrns([])}
      actions={[
        {
          icon: pinned ? faTimes : faThumbtack,
          onClick: (): void => pinSection(section),
        },
        {
          icon: faChair,
          href: `https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${section.crn}`,
        },
        {
          icon: faBan,
          id: excludeTooltipId,
          tooltip: 'Exclude from Combinations',
          onClick: (): void => excludeSection(section),
        },
      ]}
      style={pinned ? { backgroundColor: color } : undefined}
    >
      <SeatInfo section={section} term={term} />
      <div className="section-details">
        <div className="delivery-mode">
          {section.deliveryMode != null
            ? DELIVERY_MODES[section.deliveryMode]
            : ''}
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
