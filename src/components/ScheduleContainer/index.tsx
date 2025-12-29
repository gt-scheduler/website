import React, {
  ReactElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { faCalendar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { Calendar } from '..';
import TabBar from '../TabBar';
import {
  AppNavigationContext,
  SchedulerPageState,
  SchedulerPageType,
} from '../App/navigation';
import CourseDetails from '../CourseDetails';

type ScheduleContainerProps = {
  overlayCrns: string[];
  compare: boolean;
  pinnedFriendSchedules: string[];
  pinSelf: boolean;
  overlaySchedules: string[];
  mobile: boolean;
};

type SchedulerTabType =
  | SchedulerPageType.CALENDAR
  | SchedulerPageType.COURSE_DETAILS;

const TABS = [
  { key: SchedulerPageType.CALENDAR, label: 'Calendar', icon: faCalendar },
  {
    key: SchedulerPageType.COURSE_DETAILS,
    label: 'Course Details',
    icon: faInfoCircle,
  },
] as const;

export default function ScheduleContainer({
  overlayCrns,
  compare,
  pinnedFriendSchedules,
  pinSelf,
  overlaySchedules,
  mobile,
}: ScheduleContainerProps): React.ReactElement {
  const { currentSchedulerPage, setCurrentSchedulerPage } =
    useContext(AppNavigationContext);

  // We don't use the view-mode tab bar on mobile, we display in the nav menu.
  // Weird when user goes from a mobile to web view while on the scheduler page
  useEffect(() => {
    if (mobile && currentSchedulerPage.type !== SchedulerPageType.CALENDAR) {
      setCurrentSchedulerPage({ type: SchedulerPageType.CALENDAR });
    }
  }, [mobile, currentSchedulerPage.type, setCurrentSchedulerPage]);

  const selectedTab = useMemo(
    () => TABS.find((tab) => tab.key === currentSchedulerPage.type) ?? TABS[0],
    [currentSchedulerPage.type]
  );

  const handleTabSelect = useCallback(
    (key: SchedulerTabType) => {
      setCurrentSchedulerPage({ type: key });
    },
    [setCurrentSchedulerPage]
  );

  function renderSchedulerPage(
    schedulerPage: SchedulerPageState
  ): ReactElement | null {
    switch (schedulerPage.type) {
      case SchedulerPageType.CALENDAR:
        return (
          <div className="calendar-container">
            <Calendar
              className="calendar"
              overlayCrns={overlayCrns}
              compare={compare}
              pinnedFriendSchedules={pinnedFriendSchedules}
              pinSelf={!compare || pinSelf}
              overlayFriendSchedules={overlaySchedules}
            />
          </div>
        );

      case SchedulerPageType.COURSE_DETAILS:
        return <CourseDetails />;

      default:
        return null;
    }
  }

  return (
    <div className="scheduler-container">
      {!mobile && (
        <div className="view-mode">
          <span className="view-mode-label">View Mode:</span>
          <TabBar
            className="view-mode-tab-bar"
            enableSelect
            items={TABS}
            selected={selectedTab}
            onSelect={handleTabSelect}
          />
        </div>
      )}

      {renderSchedulerPage(currentSchedulerPage)}
    </div>
  );
}
