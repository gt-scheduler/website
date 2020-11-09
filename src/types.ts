export type Theme = 'light' | 'dark';

// TODO ensure types are correct
export type TermData = {
  desiredCourses: string[];
  catalogCourses: string[];
  pinnedCrns: string[];
  excludedCrns: string[];
  desiredColorMap: Record<string, string | undefined>;
  catalogColorMap: Record<string, string | undefined>;
  sortingOptionIndex: number;
};

export const defaultTermData: TermData = {
  desiredCourses: [],
  catalogCourses: [],
  pinnedCrns: [],
  excludedCrns: [],
  desiredColorMap: {},
  catalogColorMap: {},
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
