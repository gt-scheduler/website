import React from 'react';
import { connect } from 'react-redux';
import {
  faAngleDown,
  faAngleUp,
  faInfoCircle,
  faPalette,
  faPlus,
  faTrash,
} from '@fortawesome/free-solid-svg-icons';
import { classes, getContentClassName } from '../../utils';
import { actions } from '../../reducers';
import { ActionRow, Instructor, Palette, SemiPureComponent } from '../';
import './stylesheet.scss';
import cheerio from 'cheerio';
import $ from 'jquery';
import CanvasJSReact from '../../beans/canvasjs-2.3.2/canvasjs.react';

class Course extends SemiPureComponent {
  constructor(props) {
    super(props);

    this.state = {
      expanded: false,
      infoExpanded: false,
      paletteShown: false,
      critiqueData: '',
    };

    this.handleSelectColor = this.handleSelectColor.bind(this);
  }

  handleRemoveCourse(course) {
    const {
      desiredCourses,
      pinnedCrns,
      excludedCrns,
      colorMap,
    } = this.props.user;
    this.props.setDesiredCourses(
      desiredCourses.filter(courseId => courseId !== course.id)
    );
    this.props.setPinnedCrns(
      pinnedCrns.filter(
        crn => !course.sections.some(section => section.crn === crn)
      )
    );
    this.props.setExcludedCrns(
      excludedCrns.filter(
        crn => !course.sections.some(section => section.crn === crn)
      )
    );
    this.props.setColorMap({ ...colorMap, [course.id]: undefined });
  }

  handleToggleExpanded(expanded = !this.state.expanded) {
    this.setState({
      expanded: expanded,
      infoExpanded: false,
    });
  }

  handleSelectColor(color) {
    const { courseId } = this.props;
    const { colorMap } = this.props.user;
    this.props.setColorMap({ ...colorMap, [courseId]: color });
  }

  handleTogglePaletteShown(paletteShown = !this.state.paletteShown) {
    this.setState({ paletteShown });
  }
  handleInfoExpanded(infoExpanded = !this.state.infoExpanded) {
    if (this.state.critiqueData.avgGpa) {
      this.setState({
        infoExpanded: infoExpanded,
        expanded: false,
      });
    }
  }

  componentDidMount() {
    if (this.props.fromClass === 'course-list') {
      let courseString = this.props.courseId.replace(' ', '%20');
      console.log('Retreiving...');
      $.ajax({
        url: `https://cors-anywhere.herokuapp.com/http://critique.gatech.edu/course.php?id=${courseString}`,
        type: 'GET',
        dataType: 'html',
        headers: {
          'X-Requested-With': 'XMLHttpRequest',
          'Content-Type': 'text/html',
        },
        success: res => {
          // console.log(res);
          const $ = cheerio.load(res);
          let info = {
            avgGpa: Number(
              $(
                'div.center-table > table.table > tbody > tr :nth-child(2)',
                res
              ).text()
            ),
            a: Number(
              $(
                'div.center-table > table.table > tbody > tr :nth-child(3)',
                res
              ).text()
            ),
            b: Number(
              $(
                'div.center-table > table.table > tbody > tr :nth-child(4)',
                res
              ).text()
            ),
            c: Number(
              $(
                'div.center-table > table.table > tbody > tr :nth-child(5)',
                res
              ).text()
            ),
            d: Number(
              $(
                'div.center-table > table.table > tbody > tr :nth-child(6)',
                res
              ).text()
            ),
            f: Number(
              $(
                'div.center-table > table.table > tbody > tr :nth-child(7)',
                res
              ).text()
            ),
            instructors: [],
          };

          $('table#dataTable > tbody > tr', res).each((i, element) => {
            let item = {
              profName: $(element).find('td:nth-child(1)').text(),
              classSize: $(element).find('td:nth-child(2)').text(),
              avgGpa: $(element).find('td:nth-child(3)').text(),
              a: $(element).find('td:nth-child(4)').text(),
              b: $(element).find('td:nth-child(5)').text(),
              c: $(element).find('td:nth-child(6)').text(),
              d: $(element).find('td:nth-child(7)').text(),
              f: $(element).find('td:nth-child(8)').text(),
              w: $(element).find('td:nth-child(9)').text(),
            };
            let newArr = info.instructors;
            newArr.push(item);
            info.instructors = newArr;
          });

          this.setState({ critiqueData: info });
          console.log(this.state.critiqueData);
        },
        error: error => {
          console.log(error);
        },
      });
    }
  }

  value2color = (
    value = this.state.critiqueData.avgGpa,
    min = 2.5,
    max = 4.0
  ) => {
    var base = max - min;

    if (base === 0) {
      value = 100;
    } else {
      value = ((value - min) / base) * 100;
    }
    var r,
      g,
      b = 0;
    let textColor;
    if (value < 50) {
      r = 255;
      g = Math.round(5.1 * value);
      textColor = g > 128 ? '#121212' : 'white';
    } else {
      g = 255;
      r = Math.round(510 - 5.1 * value);
      textColor = '#121212';
    }
    return {
      backgroundColor: `rgba(${r}, ${g}, ${b}, 0.7)`,
      color: textColor,
    };
  };

  render() {
    const { className, courseId, onAddCourse, onSetOverlayCrns } = this.props;
    const { oscar } = this.props.db;
    const { term, pinnedCrns, colorMap } = this.props.user;
    const { expanded, paletteShown, infoExpanded, critiqueData } = this.state;

    const course = oscar.findCourse(courseId);
    const color = colorMap[course.id];
    const textClassName = getContentClassName(color);

    const options = {
      animationEnabled: true,
      animationDuration: 500,
      theme: 'dark2',
      zoomEnabled: true,
      title: {
        text: 'Grade Distribution',
      },
      axisX: {
        title: 'Letter Grade',
        reversed: true,
      },
      axisY: {
        title: 'Percentage',
      },
      data: [
        {
          type: 'pie',
          indexLabelPlacement: 'inside',
          indexLabelFontSize: 16,
          indexLabelFontStyle: 'bold',
          yValueFormatString: '##%',
          explodeOnClick: true,
          dataPoints: [
            {
              y: this.state.critiqueData.a / 100,
              indexLabel: 'A',
              color: '#388E3C',
            },
            {
              y: this.state.critiqueData.b / 100,
              indexLabel: 'B',
              color: '#CDDC39',
            },
            {
              y: this.state.critiqueData.c / 100,
              indexLabel: 'C',
              color: '#FFA000',
            },
            {
              y: this.state.critiqueData.d / 100,
              indexLabel: 'D',
              color: '#FF5722',
            },
            {
              y: this.state.critiqueData.f / 100,
              indexLabel: 'F',
              color: '#D32F2F',
            },
          ],
        },
      ],
    };

    const instructorMap = {};
    course.sections.forEach(section => {
      const [primaryInstructor = 'Not Assigned'] = section.instructors;
      if (!(primaryInstructor in instructorMap)) {
        instructorMap[primaryInstructor] = [];
      }
      instructorMap[primaryInstructor].push(section);
    });

    const infoAction = {
      icon: faInfoCircle,
      href: `https://oscar.gatech.edu/pls/bprod/bwckctlg.p_disp_course_detail?cat_term_in=${term}&subj_code_in=${course.subject}&crse_numb_in=${course.number}`,
    };

    return (
      <div
        className={classes('Course', textClassName, 'default', className)}
        style={{ backgroundColor: color }}
        key={course.id}
      >
        <ActionRow
          className={classes('course-header', expanded && 'divider-bottom')}
          actions={
            onAddCourse
              ? [{ icon: faPlus, onClick: onAddCourse }, infoAction]
              : [
                  {
                    icon: expanded ? faAngleUp : faAngleDown,
                    onClick: () => this.handleToggleExpanded(),
                  },
                  {
                    icon: faInfoCircle,
                    onClick: () => this.handleInfoExpanded(),
                  },
                  {
                    icon: faPalette,
                    onClick: () => this.handleTogglePaletteShown(),
                  },
                  {
                    icon: faTrash,
                    onClick: () => this.handleRemoveCourse(course),
                  },
                ]
          }
          color={color}
        >
          <div className="row">
            <span className="course_id" style={{ fontWeight: 750 }}>
              {course.id} <br />
              {this.props.fromClass === 'course-list' ? (
                <div
                  style={{
                    display: !this.state.infoExpanded ? 'inline-block' : 'none',
                  }}
                >
                  {critiqueData.avgGpa ? (
                    <div className="avgGpa">
                      <div className="labelAverage">Average GPA:</div>
                      <div
                        className="gpa"
                        style={this.value2color(critiqueData.avgGpa)}
                      >
                        {critiqueData.avgGpa}
                      </div>
                    </div>
                  ) : (
                    <div className="avgGpa">
                      <div className="labelAverage">Stats Not Available</div>
                    </div>
                  )}
                </div>
              ) : (
                <div></div>
              )}
            </span>

            <span className="section_ids">
              {course.sections
                .filter(section => pinnedCrns.includes(section.crn))
                .map(section => section.id)
                .join(', ')}
            </span>
          </div>
          <div className="row">
            <span
              className="course_title"
              style={{ fontWeight: 700, fontStyle: 'italic' }}
              dangerouslySetInnerHTML={{ __html: course.title }}
            />
            <span className="section_crns">
              {course.sections
                .filter(section => pinnedCrns.includes(section.crn))
                .map(section => section.crn)
                .join(', ')}
            </span>
            {paletteShown && (
              <Palette
                className="palette"
                onSelectColor={this.handleSelectColor}
                color={color}
                onMouseLeave={() => this.handleTogglePaletteShown(false)}
              />
            )}
          </div>
        </ActionRow>

        {this.props.fromClass === 'course-list' &&
        critiqueData.avgGpa &&
        infoExpanded ? (
          <div className="course-info">
            <div>
              <div className="labelAverage">Average GPA:</div>
              <div
                className="gpa"
                style={this.value2color(critiqueData.avgGpa)}
              >
                {this.state.critiqueData.avgGpa
                  ? this.state.critiqueData.avgGpa
                  : 'N/A'}
              </div>
              <CanvasJSReact.CanvasJSChart
                containerProps={{ height: '300px' }}
                options={options}
              />
            </div>
          </div>
        ) : null}

        {critiqueData && expanded && (
          <div className="course-body">
            {Object.keys(instructorMap).map(name => (
              <Instructor
                key={name}
                color={color}
                name={name}
                sections={instructorMap[name]}
                onSetOverlayCrns={onSetOverlayCrns}
                instructorData={this.state.critiqueData.instructors}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
}

export default connect(({ db, user }) => ({ db, user }), actions)(Course);
