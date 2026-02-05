import React from 'react';

import './stylesheet.scss';

export type Metric = {
  label: string;
  value?: string | null;
  unit?: string;
};

export type MetricsCardProps = {
  metrics: Metric[];
};

export default function MetricsCard({
  metrics,
}: MetricsCardProps): React.ReactElement {
  return (
    <div className="metrics-card-container">
      <ul className="metrics-list">
        {metrics.map((metric, index) => {
          const displayValue = metric.value ?? 'N/A';
          const showUnit =
            metric.value != null &&
            !metric.value.toLowerCase().includes('loading') &&
            metric.value !== 'N/A' &&
            metric.unit;

          return (
            <li key={index} className="metric-item">
              <div className="metric-value-unit-container">
                <span className="metric-value">{displayValue}</span>
                {showUnit && (
                  <span className="metric-unit"> {metric.unit}</span>
                )}
              </div>
              <div className="metric-label">{metric.label}</div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
