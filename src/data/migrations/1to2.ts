import {
  generateScheduleVersionId,
  Version1ScheduleData,
  Version2ScheduleData,
  Version2ScheduleVersion,
  Version2TermScheduleData,
} from '../types';

/**
 * Migrates from version 1 to version 2 data,
 * performing the main 3 operations:
 * - generating random IDs for each schedule version
 * - generating 'createdAt' fields for each schedule version
 * - dropping all `currentVersion` and `currentTerm` fields
 */
export default function migrate1To2(
  version1: Version1ScheduleData
): Version2ScheduleData {
  // Fix every term data
  const newData: Version2ScheduleData = {
    version: 2,
    terms: {},
  };

  Object.entries(version1.terms).forEach(([term, version1TermData]) => {
    // Create values for the 'createdAt' fields on each version
    // based on the time that versions were migrated,
    // plus an offset depending on their index in the versions array.
    // This lets the versions be sorted in the same order as before
    // when using 'createdAt' as the sort key.
    const baseCreatedAtTime = new Date();
    const versionIdxMsOffset = 1_000;
    const makeCreatedAt = (idx: number): Date =>
      new Date(baseCreatedAtTime.getTime() + versionIdxMsOffset * idx);

    const version2TermData: Version2TermScheduleData = {
      versions: {},
    };

    // Create updated schedule versions
    const newEntries = version1TermData.versions.map<
      [string, Version2ScheduleVersion]
    >((version1ScheduleVersion, idx) => {
      const id = generateScheduleVersionId();
      const createdAt = makeCreatedAt(idx);
      const version2ScheduleVersion: Version2ScheduleVersion = {
        name: version1ScheduleVersion.name,
        createdAt: createdAt.toISOString(),
        schedule: version1ScheduleVersion.schedule,
      };

      return [id, version2ScheduleVersion];
    });

    version2TermData.versions = Object.fromEntries(newEntries);
    newData.terms[term] = version2TermData;
  });

  return newData;
}
