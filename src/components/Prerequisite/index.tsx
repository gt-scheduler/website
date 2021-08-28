import React, { useContext, useState } from 'react';
import {
  faInfoCircle,
  faAngleUp,
  faAngleDown
} from '@fortawesome/free-solid-svg-icons';
import { TermContext } from '../../contexts';
import { classes, decryptReqs } from '../../utils';
import { ActionRow } from '..';
import { Course } from '../../beans';
import { PrerequisiteClause } from '../../types';

export type PrerequisiteProps = {
  course?: Course;
  option?: number;
  req?: PrerequisiteClause;
  isHeader?: boolean;
  isEmpty?: boolean;
  isLast?: boolean;
};

export default function Prerequisite({
  course,
  req,
  option,
  isHeader = false,
  isEmpty = false,
  isLast = false
}: PrerequisiteProps): React.ReactElement {
  const [{ term }] = useContext(TermContext);
  const [expanded, setExpanded] = useState(true);
  const reqStyle = { fontSize: '0.9em', padding: '8px' };

  const subreqs: PrerequisiteClause[] | null =
    typeof req === 'undefined'
      ? []
      : !Array.isArray(req)
      ? [req]
      : typeof req[0] !== 'object'
      ? (req.slice(1, req.length) as PrerequisiteClause[])
      : typeof req[0] === 'object'
      ? [req]
      : null;

  return (
    <div>
      {!isHeader && !isEmpty && req && (
        <div style={reqStyle}>
          {decryptReqs(req)} {!isLast && <strong>and</strong>}
        </div>
      )}
      {isHeader && course != null && (
        <ActionRow
          className={classes('hover-container')}
          label={req ? `Option ${option}` : `Prerequisites`}
          actions={[
            !req
              ? {
                  icon: faInfoCircle,
                  href:
                    `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_` +
                    `course_detail?cat_term_in=${term}&subj_code_in=` +
                    `${course.subject}&crse_numb_in=${course.number}`
                }
              : null,
            req && {
              icon: expanded ? faAngleUp : faAngleDown,
              onClick: (): void => setExpanded(!expanded)
            }
          ]}
        />
      )}
      {isEmpty && (
        <div style={reqStyle}>No prerequisites. You&apos;re good to go!</div>
      )}
      {expanded &&
        isHeader &&
        subreqs &&
        subreqs.map((reqs, i) => (
          <div key={i} className={classes('divider-bottom', 'nested')}>
            <Prerequisite req={reqs} isLast={i === subreqs.length - 1} />
          </div>
        ))}
    </div>
  );
}
