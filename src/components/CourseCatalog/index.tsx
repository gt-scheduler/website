import React from 'react';

export default function CourseCatalog(): React.ReactElement {
  // TODO implement
  return (
    <div className="main">
      <div style={{ padding: 16, width: '100%' }}>
        <h3>Work in progress</h3>
        <p>
          This tab is still being developed. It is present in the production
          build, but it is hidden behind a feature flag (that is enabled during
          development). To enable it in production, set{' '}
          <code>&quot;ff-2021-10-30-course-catalog&quot;</code> to{' '}
          <code>&quot;true&quot;</code> in your browser&apos;s local storage.
        </p>
      </div>
    </div>
  );
}
