import React, { ReactElement, useCallback, useContext, useMemo } from 'react';
import { faCalendar, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

import { Calendar } from '..';
import TabBar from '../TabBar';
import {
  AppNavigationContext,
  SchedulerPageState,
  SchedulerPageType,
} from '../App/navigation';

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
        return <span>Course details page placeholder</span>;

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
