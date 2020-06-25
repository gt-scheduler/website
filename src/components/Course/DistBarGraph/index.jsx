import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { getRandomColor } from '../../../utils';
import './stylesheet.scss';

const preprocess = (data, avg) => {
  let grouped = [
    {
      grade: 'A',
      Average: avg.a,
    },
    {
      grade: 'B',
      Average: avg.b,
    },
    {
      grade: 'C',
      Average: avg.c,
    },
    {
      grade: 'D',
      Average: avg.d,
    },
    {
      grade: 'F',
      Average: avg.f,
    },
    {
      grade: 'W',
      Average: avg.w,
    },
  ];

  let gradeGroup = grouped.map((obj) => {
    let key = obj.grade.toLowerCase();
    data.forEach((element) => {
      if (element) {
        const lastName = element.profName.split(', ')[0];
        obj[lastName] = Number(element[key]);
      }
    });
    return obj;
  });
  return gradeGroup;
};

export default ({ data, avg, avgColor }) => {
  const processed = preprocess(data, avg);
  const colors = data.map(() => getRandomColor());
  console.log(colors);

  return (
    <div>
      <div
        style={{
          fontSize: '1.2em',
          paddingTop: 10,
        }}
      >
        Letter Grade Distribution
      </div>
      <div
        style={{
          paddingRight: 30,
        }}
      >
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={processed}
            margin={{
              top: 15,
              right: 10,
              left: 10,
              bottom: 15,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" stroke="white" />
            <YAxis stroke="white" tickFormatter={(value) => `${value}%`} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="Average" fill={avgColor} />
            {Object.keys(processed[0]).map((element, index) => {
              if (element === 'grade' || element === 'Average') {
                return null;
              }
              return <Bar dataKey={element} fill={colors[index - 2]} />;
            })}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
