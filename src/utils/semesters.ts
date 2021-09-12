/**
 * Tries to guess whether a term string is really a term or not.
 * Terms are of the form "202008", where the first 4 digits are a year
 * and the last 2 are a month.
 */
export function isTerm(maybeTerm: string): boolean {
  if (maybeTerm.length !== 6) return false;
  const [year, month] = [maybeTerm.substring(0, 4), maybeTerm.substring(4, 6)];
  const [yearAsNumber, monthAsNumber] = [Number(year), Number(month)];
  if (Number.isNaN(yearAsNumber) || yearAsNumber < 1970 || monthAsNumber > 2100)
    return false;
  if (Number.isNaN(monthAsNumber) || monthAsNumber < 0 || monthAsNumber > 12)
    return false;

  return true;
}

/**
 * Gets the human-facing display name of a term/semester
 */
export function getSemesterName(term: string): string {
  if (!isTerm(term)) return 'Unknown';

  const year = term.substring(0, 4);
  const semester = ((): string => {
    switch (Number.parseInt(term.substring(4), 10)) {
      case 1:
        return 'Winter';
      case 2:
      case 3:
        return 'Spring';
      case 5:
      case 6:
        return 'Summer';
      case 8:
      case 9:
        return 'Fall';
      default:
        return 'Unknown';
    }
  })();
  return `${semester} ${year}`;
}
