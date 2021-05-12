import React, { useContext, useState } from 'react';
import {
  faInfoCircle,
  faAngleUp,
  faAngleDown
} from '@fortawesome/free-solid-svg-icons';
import { ScheduleContext } from '../../contexts';
import { classes, decryptReqs } from '../../utils';
import { ActionRow } from '..';

export default function Prerequisite({
  course,
  req,
  option,
  isHeader,
  isEmpty,
  isLast
}) {
  const [{ term }] = useContext(ScheduleContext);
  const [expanded, setExpanded] = useState(true);
  const reqStyle = { fontSize: '0.9em', padding: '8px' };

  const subreqs =
    typeof req === 'undefined'
      ? []
      : !req[0]
      ? [req]
      : typeof req[0] !== 'object'
      ? req.slice(1, req.length)
      : typeof req[0] === 'object'
      ? [req]
      : null;

  return (
    <div>
      {!isHeader && !isEmpty && (
        <div style={reqStyle}>
          {decryptReqs(req)} {!isLast && <strong>and</strong>}
        </div>
      )}
      {isHeader && (
        <ActionRow
          className={classes('hover-container')}
          label={req ? `Option ${option}` : `Prerequisites`}
          actions={[
            !req && {
              icon: faInfoCircle,
              href:
                `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_` +
                `course_detail?cat_term_in=${term}&subj_code_in=` +
                `${course.subject}&crse_numb_in=${course.number}`
            },
            req && {
              icon: expanded ? faAngleUp : faAngleDown,
              onClick: () => setExpanded(!expanded)
            }
          ]}
        />
      )}
      {isEmpty && (
        <div style={reqStyle}>No prerequisites. You&apos;re good to go!</div>
      )}
      {expanded &&
        isHeader &&
        subreqs.map((reqs, i) => (
          <div key={i} className={classes('divider-bottom', 'nested')}>
            <Prerequisite req={reqs} isLast={i === subreqs.length - 1} />
          </div>
        ))}
    </div>
  );
}
