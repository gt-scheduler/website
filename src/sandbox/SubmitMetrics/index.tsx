import React, { useState } from 'react';

import { SubmitMetricsRequestData, MetricTarget } from '../../data/types';
import useSubmitMetrics from '../../data/hooks/useSubmitMetrics';

export default function SubmitMetrics(): React.ReactElement {
  const [formData, setFormData] = useState<Partial<SubmitMetricsRequestData>>({
    targets: [],
    values: [],
  });

  const [metricName, setMetricName] = useState<
    '' | 'difficulty' | 'recommended'
  >('');
  const [semester, setSemester] = useState<number | undefined>(undefined);
  const [targetsJson, setTargetsJson] = useState('');
  const [valuesJson, setValuesJson] = useState('');

  const state = useSubmitMetrics({
    requestData: formData as SubmitMetricsRequestData,
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();

    if (!metricName) return;

    try {
      const targets = JSON.parse(targetsJson) as MetricTarget[];
      const values = JSON.parse(valuesJson) as number[];

      setFormData({
        metricName,
        semester,
        targets,
        values,
      });
    } catch (err) {
      // targets and values must be json
    }
  };

  const handleMetricNameChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ): void => {
    setMetricName(e.target.value as '' | 'difficulty' | 'recommended');
  };

  const handleSemesterChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    setSemester(Number(e.target.value) || undefined);
  };

  const handleTargetsChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setTargetsJson(e.target.value);
  };

  const handleValuesChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ): void => {
    setValuesJson(e.target.value);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <h1>Submit Metrics</h1>
      <form onSubmit={handleSubmit}>
        <label htmlFor="metricName">
          Metric Name:
          <select
            id="metricName"
            value={metricName}
            onChange={handleMetricNameChange}
            style={{ color: 'black', backgroundColor: 'white' }}
          >
            <option value="">Select</option>
            <option value="difficulty">difficulty</option>
            <option value="recommended">recommended</option>
          </select>
        </label>
        <br />
        <label htmlFor="targets">
          Targets:
          <textarea
            id="targets"
            value={targetsJson}
            onChange={handleTargetsChange}
            rows={3}
            cols={40}
            placeholder='[{"type": "course", "reference": "CS 1331"}]'
          />
        </label>
        <br />
        <label htmlFor="values">
          Values (JSON array of numbers):
          <textarea
            id="values"
            value={valuesJson}
            onChange={handleValuesChange}
            rows={2}
            cols={40}
            placeholder="[4, 5, 3]"
          />
        </label>
        <br />
        <label htmlFor="semester">
          Semester (YYYYMM, optional):
          <input
            style={{ color: 'black', backgroundColor: 'white' }}
            id="semester"
            type="number"
            value={String(semester)}
            onChange={handleSemesterChange}
            placeholder="202409"
            min="200000"
            max="209912"
            step="1"
          />
        </label>
        <br />
        <button type="submit" disabled={state.type === 'loading'}>
          Submit
        </button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <h3>State</h3>
        {state.type === 'loading' && <p>Loading...</p>}
        {state.type === 'loaded' && (
          <p>Loaded: Success = {String(state.result?.success)}</p>
        )}
        {state.type === 'error' && (
          <div>
            <p>Error: {state.overview}</p>
            {state.stillLoading && <p>Retrying...</p>}
          </div>
        )}
        <h4>This is what will be sent:</h4>
        <pre
          style={{
            backgroundColor: 'white',
            color: 'black',
          }}
        >
          {JSON.stringify(formData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
