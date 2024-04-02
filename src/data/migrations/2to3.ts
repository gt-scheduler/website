import {
  Version2ScheduleData,
  Version3ScheduleData,
  Version3ScheduleVersion,
  Version3TermScheduleData,
} from '../types';

/**
 * Migrates from version 1 to version 2 data,
 * performing the main 3 operations:
 * - generating random IDs for each schedule version
 * - generating 'createdAt' fields for each schedule version
 * - adding 'events' field
 */

export default function migrate2To3(
  version2: Version2ScheduleData
): Version3ScheduleData {
  const newData: Version3ScheduleData = {
    version: 3,
    terms: {},
  };

  Object.entries(version2.terms).forEach(([term, version2TermData]) => {
    const version3TermData: Version3TermScheduleData = {
      versions: {},
    };

    // Create updated schedule versions
    const newEntries = Object.entries(version2TermData.versions).map<
      [string, Version3ScheduleVersion]
    >(([id, version2ScheduleVersion]) => {
      const newFields = {
        events: [],
      };

      const version3ScheduleVersion: Version3ScheduleVersion = {
        name: version2ScheduleVersion.name,
        createdAt: version2ScheduleVersion.createdAt,
        friends: {},
        schedule: {
          ...version2ScheduleVersion.schedule,
          ...newFields,
        },
      };

      return [id, version3ScheduleVersion];
    });

    version3TermData.versions = Object.fromEntries(newEntries);
    newData.terms[term] = version3TermData;
  });

  return newData;
}
