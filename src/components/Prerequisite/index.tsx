import React, { useState, useContext } from 'react';
import {
  faAngleUp,
  faAngleDown,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';

import { ScheduleContext } from '../../contexts';
import { classes, serializePrereqs } from '../../utils/misc';
import { ActionRow } from '..';
import { Course } from '../../data/beans';
import {
  CrawlerPrerequisites,
  PrerequisiteClause,
  PrerequisiteOperator,
} from '../../types';
import { ErrorWithFields, softError } from '../../log';

const BASE_ITEM_STYLE = { fontSize: '0.9em', padding: '8px' };

export type PrerequisiteProps = {
  course: Course;
  prereqs: CrawlerPrerequisites;
};

/**
 * Renders the prereqs for a single course, given that the crawler version
 * supports prereqs. (Make sure to check this before). An empty prereq list is
 * an authoritative statement that the course has no prereqs, and as such a
 * message will be displayed telling the user. Otherwise, this component tries
 * to render the prereq tree in a way that is easily consumable without taking
 * up too much screen space, first trying to split the prereqs up into separate
 * "options" (sub-clauses of an OR set) if possible before rendering a list of
 * items with operators in between. Finally, in each item, there is the
 * flattened textual representation of the remainder of the subtree, which
 * restores parentheses groupings (much like the original Oscar prereq syntax)
 */
export default function Prerequisite({
  course,
  prereqs,
}: PrerequisiteProps): React.ReactElement {
  let content: React.ReactNode;
  if (prereqs.length === 0) {
    content = <PrerequisiteEmpty />;
  } else {
    // `prereqs` isn't an empty array, so it must be `PrerequisiteSet`
    // (here we manually `Exclude` the empty array case)
    const [op, ...subClauses] = prereqs as Exclude<CrawlerPrerequisites, []>;

    switch (op) {
      case 'and':
        // We only consider this a single "option",
        // so just render the content as a direct child
        content = <PrerequisiteClauseDisplay clause={['and', ...subClauses]} />;
        break;
      case 'or':
        if (subClauses.length === 1) {
          // There is only 1 option:
          // just render the content as a direct child
          content = (
            <PrerequisiteClauseDisplay
              clause={subClauses[0] as PrerequisiteClause}
            />
          );
        } else {
          // Render an option for each sub-clause
          content = (
            <>
              {subClauses.map((subClause, i) => (
                <PrerequisiteOption key={i} clause={subClause} index={i} />
              ))}
            </>
          );
        }
        break;
      default:
        softError(
          new ErrorWithFields({
            message: 'invalid operator found in top-level prereqs',
            fields: {
              courseId: course.id,
              operator: op,
              term: course.term,
            },
          })
        );
        content = null;
    }
  }

  const [{ term }] = useContext(ScheduleContext);

  return (
    <div className={classes('hover-container', 'nested')}>
      <ActionRow
        className={classes('hover-container')}
        label="Prerequisites"
        actions={[
          {
            icon: faInfoCircle,
            href:
              `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_` +
              `course_detail?cat_term_in=${term}&subj_code_in=` +
              `${course.subject}&crse_numb_in=${course.number}`,
          },
        ]}
      />
      <div className={classes('nested')}>{content}</div>
    </div>
  );
}

// Private sub-components

type PrerequisiteOptionProps = {
  clause: PrerequisiteClause;
  index: number;
};

/**
 * Renders a single prereq option -- a sub-clause of a larger "OR" prereq set
 * that is independently collapse-able from the other sibling options.
 * Inside, uses `PrerequisiteClauseDisplay` to render the sub-clause if
 * the option is expanded.
 */
function PrerequisiteOption({
  clause,
  index,
}: PrerequisiteOptionProps): React.ReactElement {
  const [expanded, setExpanded] = useState(true);

  return (
    <>
      <ActionRow
        className={classes('hover-container')}
        label={`Option ${index + 1}`}
        actions={[
          {
            icon: expanded ? faAngleUp : faAngleDown,
            onClick: (): void => setExpanded(!expanded),
          },
        ]}
      />
      {expanded && (
        <div className={classes('nested')}>
          <PrerequisiteClauseDisplay clause={clause} />
        </div>
      )}
    </>
  );
}

type PrerequisiteClauseDisplayProps = {
  clause: PrerequisiteClause;
};

/**
 * Renders an arbitrary prereq clause. If the clause is a singular course,
 * then it renders a single Item. Otherwise, if the clause is a set,
 * this component renders an item for each member of the set, and includes
 * an operator at the end of each item's text to indicate that each item
 * is part of a larger prereq set.
 */
function PrerequisiteClauseDisplay({
  clause,
}: PrerequisiteClauseDisplayProps): React.ReactElement {
  if (!Array.isArray(clause)) {
    // Render the single prereq course
    return <PrerequisiteItem clause={clause} operator="and" isLast />;
  }

  // Render a list of prereq items
  const [operator, ...subClauses] = clause;
  return (
    <>
      {subClauses.map((subClause, i) => (
        <PrerequisiteItem
          key={i}
          clause={subClause}
          operator={operator}
          isLast={i === subClauses.length - 1}
        />
      ))}
    </>
  );
}

type PrerequisiteItemProps = {
  clause: PrerequisiteClause;
  operator: PrerequisiteOperator;
  isLast: boolean;
};

/**
 * Renders a single "item" -- a div with the completely flattened text
 * representation of the prereq subtree passed in as `clause` (whether
 * that's a single prereq course or a sprawling sub-tree with many branches).
 * Includes the ability to display a higher-level operator between different
 * `PrerequisiteItem`'s as long as `isLast` is false, which is used by
 * `PrerequisiteClauseDisplay` when it needs to render a prerequisite set.
 */
function PrerequisiteItem({
  clause,
  operator,
  isLast,
}: PrerequisiteItemProps): React.ReactElement {
  return (
    <div className={classes('divider-bottom')} style={BASE_ITEM_STYLE}>
      {serializePrereqs(clause)} {!isLast && <strong>{operator}</strong>}
    </div>
  );
}

/**
 * Replacement prerequisite "item"-like component that simply contains
 * a notification to the user that the course has no prereqs.
 */
function PrerequisiteEmpty(): React.ReactElement {
  return (
    <div style={BASE_ITEM_STYLE}>No prerequisites. You&apos;re good to go!</div>
  );
}
