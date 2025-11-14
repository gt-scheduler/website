import { useEffect, useMemo, useState } from 'react';

import { AggregateMetricData, GetAggregatedMetricsParams } from '../types';

const COURSE_METRICS_API_URL = `http://127.0.0.1:5001/gt-scheduler-web-dev/us-east1/getAggregatedMetrics`;

// Explicit return type: Promise<AggregateMetricData[]>
async function getAggregatedMetrics(
  params: GetAggregatedMetricsParams
): Promise<AggregateMetricData[]> {
  // Convert params → URLSearchParams
  const searchParams = new URLSearchParams();

  if (params.courses) {
    params.courses.forEach((c) => searchParams.append('courses', c));
  }

  if (params.professors) {
    params.professors.forEach((p) => searchParams.append('professors', p));
  }

  if (params.metricNames) {
    params.metricNames.forEach((m) => searchParams.append('metricNames', m));
  }

  if (params.semester != null) {
    searchParams.append('semester', String(params.semester));
  }

  const url = `${COURSE_METRICS_API_URL}?${searchParams.toString()}`;

  const res = await fetch(url, {
    method: 'GET',
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch metrics: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as AggregateMetricData[];
  return data;
}

// Explicit return type: { data: AggregateMetricData[], loading: boolean }
export default function useAggregatedMetrics(
  params: GetAggregatedMetricsParams
): {
  data: AggregateMetricData[];
  loading: boolean;
} {
  const [data, setData] = useState<AggregateMetricData[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoize the stringified params to avoid unnecessary re-renders
  const paramsKey = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    let cancelled = false;

    async function go(): Promise<void> {
      setLoading(true);
      try {
        const res = await getAggregatedMetrics(params);
        if (!cancelled) setData(res);
      } catch (error) {
        // Handle error silently or log it
        console.error('Failed to fetch aggregated metrics:', error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Call and catch to satisfy no-floating-promises
    go().catch((error) => {
      console.error('Unexpected error in getAggregatedMetrics:', error);
    });

    return () => {
      cancelled = true;
    };
  }, [paramsKey, params]);

  return { data, loading };
}
