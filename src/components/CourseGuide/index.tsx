import React from 'react';
import './stylesheet.scss';
import {
  Column,
  Table,
  defaultTableRowRenderer,
  TableRowProps
} from 'react-virtualized';
import { classes } from '../../utils';

export default function CourseGuide() {
  type SectionData = {
    isProfessor: false;
    crn: string;
    section: string;
    day: string;
    time: string;
    seats: string;
    waitlist: string;
    location: string;
  };

  type ProfessorData = {
    isProfessor: true;
    name: string;
    gpa: string;
    distribution: Record<string, number>;
  };

  type Data = SectionData | ProfessorData;

  const rows: Data[] = [
    {
      isProfessor: true,
      name: 'John Stasko',
      gpa: 'GPA: 2.96',
      distribution: { A: 45.5, B: 34.9, C: 21.2, D: 2.3, F: 1.1, W: 5.4 }
    },
    {
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: '140 / 150',
      waitlist: '10 / 150',
      location: 'College of Business 100'
    },
    {
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: '140 / 150',
      waitlist: '10 / 150',
      location: 'College of Business 100'
    },
    {
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: '140 / 150',
      waitlist: '10 / 150',
      location: 'College of Business 100'
    },
    {
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: '140 / 150',
      waitlist: '10 / 150',
      location: 'College of Business 100'
    },
    {
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: '140 / 150',
      waitlist: '10 / 150',
      location: 'College of Business 100'
    },
    {
      isProfessor: true,
      name: 'Mary Hudachek-Buswell',
      gpa: 'GPA: 2.96',
      distribution: { A: 45.5, B: 34.9, C: 21.2, D: 2.3, F: 1.1, W: 5.4 }
    },
    {
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: '140 / 150',
      waitlist: '10 / 150',
      location: 'College of Business 100'
    }
  ];

  function displayDistribution(data: [string, number]) {
    return (
      <div className="distribution">
        <body className="distributionLetter">{data[0]}</body>
        <body className="distributionNumber">{data[1]} %</body>
      </div>
    );
  }

  function profRowRenderer(props: TableRowProps) {
    const professor = props.rowData as ProfessorData;

    return (
      <div className="professorRow" style={props.style}>
        <div className="professorInfo">
          <div className="professorName">{professor.name}</div>
          <div className="professorGPA">{professor.gpa}</div>
        </div>
        <div className="distribution">
          {Object.entries(professor.distribution).map(displayDistribution)}
        </div>
      </div>
    );
  }

  function rowRenderer(props: TableRowProps) {
    if (props.rowData.isProfessor) {
      return profRowRenderer({
        ...props,
        className: classes(props.className, 'professorRow')
      });
    }

    return defaultTableRowRenderer({
      ...props,
      className: props.className
    });
  }

  return (
    <Table
      className="description"
      width={875}
      height={600}
      padding={10}
      rowHeight={45}
      headerHeight={30}
      rowCount={rows.length}
      rowGetter={({ index }) => rows[index]}
      rowRenderer={rowRenderer}
    >
      <Column dataKey="logo" width={25} />
      <Column label="CRN" dataKey="crn" width={65} />
      <Column label="Sect." dataKey="section" width={65} />
      <Column label="Day" dataKey="day" width={65} />
      <Column label="Time" dataKey="time" width={150} />
      <Column label="Seats Filled" dataKey="seats" width={100} />
      <Column label="Waitlist" dataKey="waitlist" width={100} />
      <Column label="Location" dataKey="location" width={155} />
    </Table>
  );
}
