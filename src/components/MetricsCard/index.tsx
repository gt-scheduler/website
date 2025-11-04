import React from 'react';

import { classes } from '../../utils/misc';

import './stylesheet.scss';

export type Metric = {
  label: string;
  value: string;
  unit?: string;
};

export type MetricsCardProps = {
  metrics: Metric[];
};

export default function MetricsCard({
  metrics,
}: MetricsCardProps): React.ReactElement {
  return (
    <div className={classes('MetricsCard')}>
      <ul className="metrics-list">
        {metrics.map((metric, index) => (
          <li key={index} className="metric-item">
            <div className="metric-value">
              {metric.value}
              {metric.unit && (
                <span className="metric-unit"> {metric.unit}</span>
              )}
            </div>
            <div className="metric-label">{metric.label}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
