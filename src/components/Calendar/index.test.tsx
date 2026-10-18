import React from 'react';
import { render } from '@testing-library/react';
import { Immutable } from 'immer';

import Calendar from '.';
import { FriendContext, ScheduleContext } from '../../contexts';
import { FriendContextValue } from '../../contexts/friend';
import {
  ScheduleContextData,
  ScheduleContextSetters,
  ScheduleContextValue,
} from '../../contexts/schedule';
import { Oscar, Section } from '../../data/beans';
import { defaultSchedule, FriendScheduleData } from '../../data/types';
import { Event, Period } from '../../types';
import { disableLogging } from '../../utils/tests';

// jsdom does not implement `window.matchMedia`, which `Calendar` uses (via
// `useMedia`) to detect hover support. Without this stub every render logs a
// `softError`; with it, the calendar renders as a non-hover device.
beforeAll(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): unknown => ({
      matches: false,
      media: query,
      addEventListener: (): void => undefined,
      removeEventListener: (): void => undefined,
    }),
  });
});

const SELF_VERSION = 'sv_self';
const SELF_CRN = '88888';

/** 9:30-10:45 on Monday. */
const SELF_SECTION_PERIOD: Period = { start: 570, end: 645 };

/**
 * A one-section stub `Oscar`: building a real one needs a whole crawler
 * payload, and `Calendar`/`SectionBlocks`/`CompareBlocks` only ever reach for
 * `findSection`.
 */
function makeOscar(): Oscar {
  const section = {
    id: 'A',
    crn: SELF_CRN,
    credits: 3,
    deliveryMode: 'Residential',
    course: { id: 'CS 1331', title: 'Intro to Object Oriented Programming' },
    meetings: [
      {
        period: SELF_SECTION_PERIOD,
        days: ['M'],
        where: 'Klaus 1443',
        instructors: ['Prof'],
      },
    ],
  } as unknown as Section;

  return {
    findSection: (crn: string): Section | undefined =>
      crn === SELF_CRN ? section : undefined,
  } as unknown as Oscar;
}

function makeSetters(): ScheduleContextSetters {
  return {
    setTerm: jest.fn(),
    patchSchedule: jest.fn(),
    updateSchedule: jest.fn(),
    setCurrentVersion: jest.fn(),
    addNewVersion: jest.fn(),
    deleteVersion: jest.fn(),
    renameVersion: jest.fn(),
    cloneVersion: jest.fn(),
    deleteFriendRecord: jest.fn(),
    setCourseContainerTab: jest.fn(),
  };
}

function makeScheduleData(events: Event[] = []): ScheduleContextData {
  const schedule = {
    ...defaultSchedule,
    pinnedCrns: [SELF_CRN],
    events,
  };
  return {
    term: '202608',
    currentVersion: SELF_VERSION,
    currentFriends: {},
    allFriends: {},
    allVersionNames: [{ id: SELF_VERSION, name: 'Primary' }],
    courseContainerTab: 0,
    oscar: makeOscar(),
    versions: {
      [SELF_VERSION]: {
        name: 'Primary',
        friends: {},
        createdAt: '2023-01-01T00:00:00.000Z',
        schedule,
      },
    },
    ...schedule,
  };
}

/** Builds friend schedule data, one events-only version per named friend. */
function makeFriends(
  friendEvents: Record<string, Event[]>
): Immutable<FriendScheduleData> {
  return Object.fromEntries(
    Object.entries(friendEvents).map(([name, events]) => [
      `uid-${name}`,
      {
        name,
        email: `${name}@example.com`,
        versions: {
          [`v-${name}`]: {
            name: 'Primary',
            schedule: { ...defaultSchedule, events },
          },
        },
      },
    ])
  ) as Immutable<FriendScheduleData>;
}

function event(id: string, name: string, start: number, end: number): Event {
  return { id, name, period: { start, end }, days: ['M'] };
}

type RenderedBlock = { left: number; width: number; text: string };

function blocksIn(container: HTMLElement): RenderedBlock[] {
  return Array.from(container.querySelectorAll<HTMLElement>('.meeting')).map(
    (element) => ({
      left: parseFloat(element.style.left),
      width: parseFloat(element.style.width),
      text: element.textContent ?? '',
    })
  );
}

function blockContaining(
  blocks: RenderedBlock[],
  needle: string
): RenderedBlock {
  const match = blocks.filter((block) => block.text.includes(needle));
  if (match.length !== 1) {
    throw new Error(
      `expected exactly 1 block containing "${needle}", got ${match.length}`
    );
  }
  return match[0] as RenderedBlock;
}

function renderCalendar(
  scheduleData: ScheduleContextData,
  friends: Immutable<FriendScheduleData>,
  calendar: React.ReactElement
): RenderedBlock[] {
  const scheduleValue: ScheduleContextValue = [scheduleData, makeSetters()];
  const friendValue: FriendContextValue = [
    { friends },
    {
      updateFriendTermData: jest.fn(),
      updateFriendInfo: jest.fn(),
      renameFriend: jest.fn(),
    },
  ];
  const { container } = render(
    <ScheduleContext.Provider value={scheduleValue}>
      <FriendContext.Provider value={friendValue}>
        {calendar}
      </FriendContext.Provider>
    </ScheduleContext.Provider>
  );
  return blocksIn(container);
}

/**
 * A Monday where the current user's own 9:30-10:45 section and three friends'
 * blocks chain across the morning. Only ever two blocks are concurrent, so
 * every column should be split in half.
 */
const MONDAY_FRIENDS = makeFriends({
  Sofia: [event('sofia-1', 'CS 1332', 600, 675)], // 10:00-11:15
  Alex: [event('alex-1', 'ENGL 1102', 540, 600)], // 9:00-10:00
  Marco: [event('marco-1', 'CS 2110', 660, 735)], // 11:00-12:15
});

describe('Calendar (compare mode) column packing', () => {
  it('splits the column evenly between two overlapping schedules', () => {
    const blocks = renderCalendar(
      makeScheduleData(),
      makeFriends({ Sofia: [event('sofia-1', 'CS 1332', 600, 675)] }),
      <Calendar
        overlayCrns={[]}
        compare
        pinnedFriendSchedules={[SELF_VERSION]}
        overlayFriendSchedules={['v-Sofia']}
      />
    );

    const self = blockContaining(blocks, 'CS 1331');
    const sofia = blockContaining(blocks, 'CS 1332');

    expect(self.width).toBeCloseTo(10);
    expect(sofia.width).toBe(self.width);
    // ...and they sit side by side, filling the whole 20% day column
    expect([self.left, sofia.left].sort((a, b) => a - b)).toEqual([0, 10]);
  });

  it('still splits it evenly once more schedules are toggled on', () => {
    const blocks = renderCalendar(
      makeScheduleData(),
      MONDAY_FRIENDS,
      <Calendar
        overlayCrns={[]}
        compare
        pinnedFriendSchedules={[SELF_VERSION]}
        overlayFriendSchedules={['v-Sofia', 'v-Alex', 'v-Marco']}
      />
    );

    expect(blocks).toHaveLength(4);

    const self = blockContaining(blocks, 'CS 1331'); // 9:30-10:45
    const sofia = blockContaining(blocks, 'CS 1332'); // 10:00-11:15
    const alex = blockContaining(blocks, 'ENGL 1102'); // 9:00-10:00
    const marco = blockContaining(blocks, 'CS 2110'); // 11:00-12:15

    // Never more than two people are busy at once, so every block takes half
    // the day column -- adding a third, non-concurrent schedule must not
    // shrink the blocks that do overlap.
    [self, sofia, alex, marco].forEach((block) => {
      expect(block.width).toBeCloseTo(10);
    });

    // The pairs that actually overlap tile the column with no dead space
    // between them: 0%..10% and 10%..20%.
    expect(alex.left).toBe(0);
    expect(self.left).toBe(10);
    expect(sofia.left).toBe(0);
    expect(marco.left).toBe(10);
  });

  it('gives one schedule shown under two people a single column', () => {
    // A schedule version that is accessible through two different people is
    // overlaid once per person. Its blocks are drawn on top of each other
    // (React warns about the duplicate key, which is pre-existing and
    // unrelated to packing) and must only ever take a single column.
    disableLogging();

    const sofia = makeFriends({
      Sofia: [event('sofia-1', 'CS 1332', 600, 675)],
    })['uid-Sofia'];
    const friends = {
      'uid-Sofia': sofia,
      'uid-Sofia-alt': { ...sofia, name: 'Sofia Alt' },
    } as Immutable<FriendScheduleData>;

    const blocks = renderCalendar(
      makeScheduleData(),
      friends,
      <Calendar
        overlayCrns={[]}
        compare
        pinnedFriendSchedules={[SELF_VERSION]}
        overlayFriendSchedules={['v-Sofia']}
      />
    );

    const self = blockContaining(blocks, 'CS 1331');
    const sofias = blocks.filter((block) => block.text.includes('CS 1332'));
    expect(sofias).toHaveLength(2);

    // Two columns, not three: the doubled version does not claim one of
    // its own.
    expect(self.width).toBeCloseTo(10);
    sofias.forEach((block) => {
      expect(block.width).toBeCloseTo(10);
      expect(block.left).toBe(sofias[0]?.left);
    });
    expect([self.left, sofias[0]?.left ?? -1].sort((a, b) => a - b)).toEqual([
      0, 10,
    ]);
  });
});

describe('Calendar (regular scheduler) column packing', () => {
  // The non-compare calendar keeps its original layout: blocks are packed in
  // ascending duration order and a chain of overlaps splits the column once
  // per link. Locked down here so the compare-mode packing cannot leak into
  // it.
  it('is unchanged for a chain of overlapping blocks', () => {
    const blocks = renderCalendar(
      makeScheduleData([
        event('e1', 'Lunch', 600, 675), // 10:00-11:15
        event('e2', 'Gym', 660, 735), // 11:00-12:15
      ]),
      {},
      <Calendar overlayCrns={[]} />
    );

    expect(blocks).toHaveLength(3);
    blocks.forEach((block) => expect(block.width).toBeCloseTo(20 / 3, 5));
    expect(blockContaining(blocks, 'CS 1331').left).toBe(0);
    expect(blockContaining(blocks, 'Lunch').left).toBeCloseTo(20 / 3, 5);
    expect(blockContaining(blocks, 'Gym').left).toBeCloseTo(40 / 3, 5);
  });

  it('is unchanged for a single non-overlapping block', () => {
    const blocks = renderCalendar(
      makeScheduleData(),
      {},
      <Calendar overlayCrns={[]} />
    );

    expect(blocks).toHaveLength(1);
    expect(blocks[0]?.width).toBe(20);
    expect(blocks[0]?.left).toBe(0);
  });
});
