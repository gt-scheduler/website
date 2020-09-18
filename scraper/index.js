const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs');

scrapeClassInfo(202008, 91428);

function scrapeClassInfo(term, crn) {
  request(
    `https://oscar.gatech.edu/pls/bprod/bwckschd.p_disp_detail_sched?term_in=${term}&crn_in=${crn}`,
    (error, response, html) => {
      if (!error & (response.statusCode == 200)) {
        const $ = cheerio.load(html);

        const availabilityTable = $('.datadisplaytable .datadisplaytable');

        const classInfo = {
          classCapacity: parseInt(
            availabilityTable.find('tr').eq(1).children('td').first().text(),
            10
          ),
          filledSeats: parseInt(
            availabilityTable.find('tr').eq(1).children('td').eq(1).text(),
            10
          ),
          waitlistCapacity: parseInt(
            availabilityTable.find('tr').eq(2).children('td').first().text(),
            10
          ),
          filledWaitlistSeats: parseInt(
            availabilityTable.find('tr').eq(2).children('td').eq(1).text(),
            10
          )
        };

        let data = JSON.stringify(classInfo, null, 2);
        fs.writeFileSync('classInfo.json', data);
      }
    }
  );
}

module.exports = scrapeClassInfo;
