import {
  MetricName,
  TargetType,
  SubmitMetricsRequestData,
} from '../data/types';

// Course format: ABCD 1234
export function validateCourse(reference: string): boolean {
  return /^[A-Z]+ \d{4}$/.test(reference);
}

// Professor: alphabetical + spaces + hyphens
export function validateProfessor(reference: string): boolean {
  return /^[A-Za-z-]+(?:\s[A-Za-z-]+)*$/.test(reference);
}

// Section: ABC01 (letters + digits)
export function validateSection(reference: string): boolean {
  return /^[A-Z]+\d+$/.test(reference);
}

export function validateTarget(target: unknown): boolean {
  if (typeof target !== 'object' || target === null) return false;

  const t = target as { type: TargetType; reference: string };

  if (!Object.values(TargetType).includes(t.type)) return false;
  if (typeof t.reference !== 'string') return false;

  switch (t.type) {
    case TargetType.COURSE:
      return validateCourse(t.reference);
    case TargetType.PROFESSOR:
      return validateProfessor(t.reference);
    case TargetType.SECTION:
      return validateSection(t.reference);
    default:
      return false;
  }
}

export function validateSemester(value: unknown): boolean {
  if (typeof value !== 'number') return false;

  const str = String(value);
  if (!/^\d{6}$/.test(str)) return false;

  const year = Number(str.substring(0, 4));
  const month = Number(str.substring(4, 6));

  if (Number.isNaN(year) || year < 1970 || year > 2100) return false;
  if (Number.isNaN(month)) return false;

  // Allowed months: 01, 02, 03, 05, 06, 08, 09
  const allowedMonths = new Set([1, 2, 3, 5, 6, 8, 9]);
  return allowedMonths.has(month);
}

export function validateMetricData(data: unknown): boolean {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as SubmitMetricsRequestData;

  // Metric name
  if (!Object.values(MetricName).includes(d.metricName)) return false;

  // Targets
  if (!Array.isArray(d.targets)) return false;
  for (const target of d.targets) {
    if (!validateTarget(target)) return false;
  }

  // Semester
  if (d.semester !== undefined && !validateSemester(d.semester)) {
    return false;
  }

  return true;
}
