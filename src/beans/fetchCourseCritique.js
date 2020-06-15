import cheerio from 'cheerio';
import axios from 'axios';

var storedCritiques = {};

const addCourse = (courseId, critique) => {
  storedCritiques[courseId] = critique;
  console.log(storedCritiques);
};

const removeCourse = (courseId) => {
  delete storedCritiques[courseId];
};

const fetchCourseCritique = async (courseId) => {
  let courseString = courseId.replace(' ', '%20');
  return await axios({
    url: `https://cors-anywhere.herokuapp.com/http://critique.gatech.edu/course.php?id=${courseString}`,
    method: 'get',
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'text/html',
    },
  })
    .then((response) => response.data)
    .then(handleParse)
    .then((res) => {
      addCourse(courseId, res);
      return res;
    });
};

const handleParse = (res) => {
  // console.log(res);
  const $ = cheerio.load(res);
  let info = {
    avgGpa: Number(
      $('div.center-table > table.table > tbody > tr :nth-child(2)', res).text()
    ),
    a: Number(
      $('div.center-table > table.table > tbody > tr :nth-child(3)', res).text()
    ),
    b: Number(
      $('div.center-table > table.table > tbody > tr :nth-child(4)', res).text()
    ),
    c: Number(
      $('div.center-table > table.table > tbody > tr :nth-child(5)', res).text()
    ),
    d: Number(
      $('div.center-table > table.table > tbody > tr :nth-child(6)', res).text()
    ),
    f: Number(
      $('div.center-table > table.table > tbody > tr :nth-child(7)', res).text()
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

  return info;
};

export { fetchCourseCritique, storedCritiques };
