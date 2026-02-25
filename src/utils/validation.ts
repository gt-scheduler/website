import { SubmitRatingsRequestDataSchema } from '../data/types';

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
  const result = SubmitRatingsRequestDataSchema.omit({
    IDToken: true,
  }).safeParse(data);
  return result.success;
}
