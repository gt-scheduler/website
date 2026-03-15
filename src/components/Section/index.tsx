import React, {
  useCallback,
  useContext,
  useEffect,
  useId,
  useState,
} from 'react';
import { Tooltip as ReactTooltip } from 'react-tooltip';
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
import { Seating } from '../../data/beans/Section';
import { ErrorWithFields, softError } from '../../log';

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
  const [seating, setSeating] = useState<Seating>([[], 0]);

  const updateSeating = useCallback((): void => {
    section
      .fetchSeating(term)
      .then((newSeating) => {
        setSeating(newSeating);
      })
      .catch((err) =>
        softError(
          new ErrorWithFields({
            message: 'error while fetching seating',
            source: err,
            fields: { crn: section.crn, term: section.term },
          })
        )
      );
  }, [section, term]);

  let hovering = false;
  const handleHover = (): void => {
    hovering = true;
    setTimeout(() => {
      if (hovering) {
        updateSeating();
      }
    }, 333);
  };

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

  const sectionIsFull = (): boolean => {
    if (seating[0].length > 0 && typeof seating[0][1] === 'number') {
      const seatsTaken = seating[0][1];
      const capacity = seating[0][0];

      if (typeof capacity !== 'number') return false;
      if (seatsTaken >= capacity) return true;
    }

    return false;
  };

  // Gather seating data on initial load
  useEffect(() => {
    updateSeating();
  }, [updateSeating]);

  let name = section.id;
  if (sectionIsFull()) name += ' (Full)';

  const excludeTooltipId = useId();
  const sectionTooltipId = useId();
  return (
    <ActionRow
      label={name}
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
          id: sectionTooltipId,
          href: `https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${section.crn}`,
        },
        {
          icon: faBan,
          id: excludeTooltipId,
          tooltip: 'Exclude from Combinations',
          onClick: (): void => excludeSection(section),
        },
      ]}
      style={
        pinned
          ? { backgroundColor: color }
          : sectionIsFull()
          ? { backgroundColor: 'rgba(244, 78, 59, 0.5)' }
          : undefined
      }
    >
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

        <ReactTooltip
          anchorId={sectionTooltipId}
          className="tooltip"
          variant="dark"
          place="top"
          afterShow={(): void => handleHover()}
          afterHide={(): void => {
            hovering = false;
          }}
        >
          <table>
            <tbody>
              <tr>
                <td>
                  <b>Seats Filled</b>
                </td>
                <td>
                  {seating[0].length === 0
                    ? `Loading...`
                    : typeof seating[0][1] === 'number'
                    ? `${seating[0][1] ?? '<unknown>'} of ${
                        seating[0][0] ?? '<unknown>'
                      }`
                    : `N/A`}
                </td>
              </tr>
              <tr>
                <td>
                  <b>Waitlist Filled</b>
                </td>
                <td>
                  {seating[0].length === 0
                    ? `Loading...`
                    : typeof seating[0][1] === 'number'
                    ? `${seating[0][3] ?? '<unknown>'} of ${
                        seating[0][2] ?? '<unknown>'
                      }`
                    : `N/A`}
                </td>
              </tr>
            </tbody>
          </table>
        </ReactTooltip>
      </div>
    </ActionRow>
  );
}
