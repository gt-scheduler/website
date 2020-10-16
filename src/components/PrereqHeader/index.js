import React, { useContext, useState } from 'react';
import { faAngleDown, faAngleUp, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { TermContext } from '../../contexts';
import { classes } from '../../utils';
import { ActionRow } from '..';

export function PrereqHeader({ course, requirement, option }) {
  const [{ term }] = useContext(TermContext);
  const [expanded, setExpanded] = useState(true);

  console.log(requirement);

  return (
    <div className={ classes(!expanded && 'divider-bottom') }>
      <ActionRow
        label={requirement ? `Option ${option}` : `Prerequisites`}
        actions={[
          requirement && {
            icon: expanded ? faAngleUp : faAngleDown,
            onClick: () => setExpanded(!expanded)
          },
          !requirement && {
            icon: faInfoCircle,
            href: `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_`
              + `course_detail?cat_term_in=${term}&subj_code_in=`
              + `${course.subject}&crse_numb_in=${course.number}`
          }
        ]}
      >
      </ActionRow>
    </div>
  );
}
