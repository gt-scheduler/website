export type Theme = 'light' | 'dark';

// TODO ensure types are correct
export type ScheduleData = {
  desiredCourses: string[];
  pinnedCrns: string[];
  excludedCrns: string[];
  colorMap: Record<string, string | undefined>;
  sortingOptionIndex: number;
};

export type VersionsData = {
  [key: string]: string[];
};

export const defaultScheduleData: ScheduleData = {
  desiredCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  colorMap: {},
  sortingOptionIndex: 0
};

// Declare (better) types for the ICS library
export type ICS = {
  download(filename: string, ext?: string): string | false;
  addEvent(
    subject: string,
    description: string,
    location: string,
    begin: string | Date,
    stop: string | Date,
    rrule: any
  ): false | string[];
};
