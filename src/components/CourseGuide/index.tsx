import React from 'react';
import './stylesheet.scss';
import {
  Column,
  Table,
  defaultTableRowRenderer,
  TableRowProps,
  TableCellProps,
  defaultTableCellRenderer
} from 'react-virtualized';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPlus,
  faCheck,
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';
import { classes } from '../../utils';

export default function CourseGuide() {
  type SectionData = {
    isSelected: boolean;
    hasConflict: boolean;
    isProfessor: false;
    crn: string;
    section: string;
    day: string;
    time: string;
    seats: [number, number];
    waitlist: [number, number];
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
      isSelected: false,
      hasConflict: false,
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: [140, 150],
      waitlist: [10, 150],
      location: 'College of Business 100'
    },
    {
      isSelected: false,
      hasConflict: false,
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: [0, 0],
      waitlist: [0, 0],
      location: 'College of Business 100'
    },
    {
      isSelected: false,
      hasConflict: false,
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: [10, 10],
      waitlist: [10, 10],
      location: 'College of Business 100'
    },
    {
      isSelected: true,
      hasConflict: false,
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: [41, 50],
      waitlist: [41, 50],
      location: 'College of Business 100'
    },
    {
      isSelected: false,
      hasConflict: true,
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: [10, 20],
      waitlist: [10, 20],
      location: 'College of Business 100'
    },
    {
      isProfessor: true,
      name: 'Mary Hudachek-Buswell',
      gpa: 'GPA: 2.96',
      distribution: { A: 100.0, B: 34.9, C: 21.2, D: 2.3, F: 1.1, W: 5.4 }
    },
    {
      isSelected: false,
      hasConflict: false,
      isProfessor: false,
      crn: '12345',
      section: 'A01',
      day: 'MWF',
      time: '11:00am - 11:50am',
      seats: [10, 150],
      waitlist: [10, 150],
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

  function logoCellRenderer(props: TableCellProps) {
    const data = props.rowData as SectionData;

    if (data.isSelected) {
      return (
        <div>
          <button type="button" className="description">
            <FontAwesomeIcon icon={faCheck} color="#8BD6FB" />
          </button>
        </div>
      );
    }
    return (
      <div>
        <button type="button" className="description">
          <FontAwesomeIcon icon={faPlus} color="#8BD6FB" />
        </button>
      </div>
    );
  }

  function timeCellRenderer(props: TableCellProps) {
    if (!props.rowData.isProfessor) {
      if (props.rowData.hasConflict) {
        return (
          <div>
            {props.rowData.time}{' '}
            <FontAwesomeIcon icon={faExclamationTriangle} />
          </div>
        );
      }
    }

    return defaultTableCellRenderer(props);
  }

  function seatsCellRenderer(props: TableCellProps) {
    if (!props.rowData.isProfessor) {
      return (
        <div className="fraction">
          <div className="taken"> {props.rowData.seats[0]} </div>
          <div className="slash"> / </div>
          <div className="total"> {props.rowData.seats[1]} </div>
        </div>
      );
    }
  }

  function waitlistCellRenderer(props: TableCellProps) {
    if (!props.rowData.isProfessor) {
      return (
        <div className="fraction">
          <div className="taken"> {props.rowData.waitlist[0]} </div>
          <div className="slash"> / </div>
          <div className="total"> {props.rowData.waitlist[1]} </div>
        </div>
      );
    }
  }

  function rowRenderer(props: TableRowProps) {
    if (props.rowData.isProfessor) {
      return profRowRenderer({
        ...props,
        className: classes(props.className, 'professorRow')
      });
    }

    if (props.rowData.hasConflict) {
      return (
        <div>
          {defaultTableRowRenderer({
            ...props,
            className: classes(props.className, 'conflict')
          })}
        </div>
      );
    }

    return (
      <div>
        {defaultTableRowRenderer({
          ...props,
          className: props.className
        })}
      </div>
    );
  }

  return (
    <Table
      className="description"
      width={830}
      height={600}
      padding={20}
      rowHeight={40}
      headerHeight={30}
      rowCount={rows.length}
      rowGetter={({ index }) => rows[index]}
      rowRenderer={rowRenderer}
    >
      <Column dataKey="logo" width={25} cellRenderer={logoCellRenderer} />
      <Column label="CRN" dataKey="crn" width={60} />
      <Column label="Sect." dataKey="section" width={50} />
      <Column label="Day" dataKey="day" width={55} />
      <Column
        label="Time"
        dataKey="time"
        width={150}
        cellRenderer={timeCellRenderer}
      />
      <Column
        label="Seats Filled"
        dataKey="seats"
        width={100}
        cellRenderer={seatsCellRenderer}
      />
      <Column
        label="Waitlist"
        dataKey="waitlist"
        width={100}
        cellRenderer={waitlistCellRenderer}
      />
      <Column label="Location" dataKey="location" width={170} />
    </Table>
  );
}
