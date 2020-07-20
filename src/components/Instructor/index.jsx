import React from 'react';
import { connect } from 'react-redux';
import { faAngleDown, faAngleUp, faBan, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { classes, simplifyName, unique } from '../../utils';
import { actions } from '../../reducers';
import { ActionRow, Section, SemiPureComponent } from '../';
import './stylesheet.scss';

class Instructor extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      expanded: true,
    };
  }

  includeSection(section) {
    const { excludedCrns } = this.props.user;
    this.props.setExcludedCrns(excludedCrns.filter(crn => crn !== section.crn));
  }

  excludeSections(sections) {
    const { pinnedCrns, excludedCrns } = this.props.user;
    const crns = sections.map(section => section.crn);
    this.props.setExcludedCrns(unique([...excludedCrns, ...crns]));
    this.props.setPinnedCrns(pinnedCrns.filter(crn => !crns.includes(crn)));
  }

  toggleExpanded(expanded = !this.state.expanded) {
    this.setState({ expanded });
  }

  render() {
    const { className, color, name, sections, gpa } = this.props;
    const { pinnedCrns, excludedCrns } = this.props.user;
    const { expanded } = this.state;

    const instructorPinned = sections.some(section => pinnedCrns.includes(section.crn));

    const includedSections = sections.filter(section => !excludedCrns.includes(section.crn));
    const excludedSections = sections.filter(section => excludedCrns.includes(section.crn));

    return (
      <div className={classes('Instructor', !expanded && 'divider-bottom', className)}>
        <ActionRow label={name || 'Not Assigned'}
                   actions={[
                     { icon: expanded ? faAngleUp : faAngleDown, onClick: () => this.toggleExpanded() },
                     !['TBA', 'Not Assigned'].includes(name) && {
                       icon: faInfoCircle,
                       href: `http://www.ratemyprofessors.com/search.jsp?queryBy=teacherName&schoolName=Georgia+Institute+of+Technology&query=${encodeURIComponent(simplifyName(name))}`,
                     },
                     { icon: faBan, onClick: () => this.excludeSections(sections) },
                   ]}
                   style={instructorPinned ? { backgroundColor: color } : undefined}>
          <div className="instructor-row">
            <span className="gpa">
              Instructor GPA: {gpa || 'N/A'}
            </span>
          </div>
        </ActionRow>
        {
          expanded &&
          <div className={classes('section-container', 'nested')}>
            {
              includedSections.map(section => {
                const pinned = pinnedCrns.includes(section.crn);
                return (
                  <Section key={section.id} className="divider-bottom" section={section} color={color} pinned={pinned}/>
                );
              })
            }
            {
              excludedSections.length > 0 &&
              <div className="excluded-section-container">
                {
                  excludedSections.map(section => (
                    <span className="excluded-section" key={section.id}
                          onClick={() => this.includeSection(section)}>
                      {section.id}
                    </span>
                  ))
                }
              </div>
            }
          </div>
        }
      </div>
    );
  }
}

export default connect(({ user }) => ({ user }), actions)(Instructor);
