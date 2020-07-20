import React from 'react';
import { connect } from 'react-redux';
import { faBan, faInfoCircle, faThumbtack, faTimes } from '@fortawesome/free-solid-svg-icons';
import { classes, periodToString, simplifyInstructionalMethod } from '../../utils';
import { actions } from '../../reducers';
import { ActionRow, SemiPureComponent } from '../';
import './stylesheet.scss';

class Section extends SemiPureComponent {
  excludeSection(section) {
    const { pinnedCrns, excludedCrns } = this.props.user;
    this.props.setExcludedCrns([...excludedCrns, section.crn]);
    this.props.setPinnedCrns(pinnedCrns.filter(crn => crn !== section.crn));
  }

  pinSection(section) {
    const { pinnedCrns, excludedCrns } = this.props.user;
    if (pinnedCrns.includes(section.crn)) {
      this.props.setPinnedCrns(pinnedCrns.filter(crn => crn !== section.crn));
    } else {
      this.props.setPinnedCrns([...pinnedCrns, section.crn]);
      this.props.setExcludedCrns(excludedCrns.filter(crn => crn !== section.crn));
    }
  }

  render() {
    const { term } = this.props.user;
    const { className, section, pinned, color } = this.props;
    return (
      <ActionRow label={section.id} className={classes('Section', className)}
                 onMouseEnter={() => this.props.setOverlayCrns([section.crn])}
                 onMouseLeave={() => this.props.setOverlayCrns([])} actions={[
        { icon: pinned ? faTimes : faThumbtack, onClick: () => this.pinSection(section) },
        {
          icon: faInfoCircle,
          href: `https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${section.crn}`,
        },
        { icon: faBan, onClick: () => this.excludeSection(section) },
      ]} style={pinned ? { backgroundColor: color } : undefined}>
        <div className="section-details">
          <div className="instructional-method">
            {
              section.instructionalMethod &&
              simplifyInstructionalMethod(section.instructionalMethod)
            }
          </div>
          <div className="meeting-container">
            {
              section.meetings.map((meeting, i) => {
                return (
                  <div className="meeting" key={i}>
                    <span className="days">{meeting.days.join('')}</span>
                    <span className="period">{periodToString(meeting.period)}</span>
                  </div>
                );
              })
            }
          </div>
        </div>
      </ActionRow>
    );
  }
}

export default connect(({ user }) => ({ user }), actions)(Section);
