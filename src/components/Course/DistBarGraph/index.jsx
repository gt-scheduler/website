import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { getRandomColor } from '../../../utils';

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

const objectWithoutKey = (object, key) => {
  const { [key]: deletedKey, ...otherKeys } = object;
  return otherKeys;
};

export default ({ data, avg, avgColor }) => {
  const processed = preprocess(data, avg);
  const colors = data.map(() => getRandomColor());
  console.log(colors);

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={processed}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="grade" />
        <YAxis />
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
  );
};
