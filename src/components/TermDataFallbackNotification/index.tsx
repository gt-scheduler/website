import React from 'react';

import ErrorHeader from '../ErrorHeader';
import { BaseErrorDetails, ErrorDetailsField } from '../ErrorDetails';
import ExpandableCard from '../ExpandableCard';
import { getSemesterName } from '../../utils/semesters';
import { NonEmptyArray } from '../../types';

import './stylesheet.scss';

export type FallbackResult = 'accepted' | 'rejected';

/**
 * Renders some contents that present the user with the option of
 * accepting or ignoring the application's suggested fallback
 * for their invalid term data.
 */
export function renderTermDataFallbackNotification(
  props: TermDataFallbackNotificationProps
): React.ReactElement {
  return <TermDataFallbackNotification {...props} />;
}

const GITHUB_ISSUE_URL =
  'https://github.com/gt-scheduler/website/issues/new?assignees=&labels=help-request&template=help----.md&title=';

export type TermDataFallbackNotificationProps = {
  originalRaw: string;
  fallbackRaw: string;
  errors: NonEmptyArray<Error>;
  term: string;
  onAccept: () => void;
};

/**
 * Content that is shown in the modal when `showTermDataFallbackNotification`
 * is called
 */
export function TermDataFallbackNotification({
  originalRaw,
  fallbackRaw,
  errors,
  term,
  onAccept,
}: TermDataFallbackNotificationProps): React.ReactElement {
  const semester = getSemesterName(term);
  return (
    <div className="term-data-fallback-notification">
      <ErrorHeader />
      <p>
        Your schedule data for <strong>{semester}</strong> could not be
        successfully loaded from cookies. The application has attempted to
        automatically recover the data, but it may not have been able to recover
        all of it.
      </p>
      <p>
        <strong>
          Would you like to accept the recovered data (at the risk of losing
          some data)?
        </strong>{' '}
        If you don&apos;t accept, then you won&apos;t be able to access your{' '}
        {semester} data but you can still switch to another term or manually fix
        your data.
      </p>
      <p>
        If you&apos;re unsure of what to do and want help from the gt-scheduler
        maintainers, consider filing{' '}
        <a href={GITHUB_ISSUE_URL} target="_blank" rel="noreferrer noopener">
          a new issue on the gt-scheduler GitHub
        </a>
        , and include the below information under &ldquo;Original&rdquo; and
        &ldquo;Proposed fallback&rdquo; in addition to all of the content under
        &ldquo;Error Details&rdquo;.
      </p>
      <button
        className="term-data-fallback-notification-button"
        onClick={onAccept}
        type="button"
      >
        Accept
      </button>
      <ErrorDetailsField name="Original">
        <ExpandableCard label="Expand" style={{ marginTop: 4 }}>
          <pre>
            <code>{tryPrettifyRawJSON(originalRaw)}</code>
          </pre>
        </ExpandableCard>
      </ErrorDetailsField>
      <ErrorDetailsField name="Proposed fallback" style={{ marginTop: 16 }}>
        <ExpandableCard label="Expand" style={{ marginTop: 4 }}>
          <pre>
            <code>{tryPrettifyRawJSON(fallbackRaw)}</code>
          </pre>
        </ExpandableCard>
      </ErrorDetailsField>
      <ErrorDetailsField name="Error Details" style={{ marginTop: 16 }}>
        <ExpandableCard label="Expand" style={{ marginTop: 4 }}>
          {errors.length > 1 ? (
            errors.map((err, i) => (
              <ExpandableCard key={i} label={`Error #${i + 1} Details`}>
                <BaseErrorDetails error={err} />
              </ExpandableCard>
            ))
          ) : (
            <BaseErrorDetails error={errors[0]} />
          )}
        </ExpandableCard>
      </ErrorDetailsField>
    </div>
  );
}

function tryPrettifyRawJSON(rawJSON: string): string {
  try {
    return JSON.stringify(JSON.parse(rawJSON), null, 2);
  } catch (err) {
    return rawJSON;
  }
}
