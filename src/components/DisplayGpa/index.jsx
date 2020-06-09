import React, { useState, useEffect } from "react";
import "./stylesheet.scss";
import axios from "axios";
import cheerio from "cheerio";
import $ from "jquery";
import styled from "@emotion/styled";

const DisplayGpa = props => {
  const [background, setBackground] = useState();
  const [gpa, setGpa] = useState(props.gpa);
  const [url, setUrl] = useState("");
  const errMessage = "GPA could not be accessed, try again later";

  useEffect(() => {
    // getAverageGpa(props.courseId);
  }, []);

  const getAverageGpa = courseId => {
    let courseString = courseId.replace(" ", "%20");
    $.ajax({
      url: `https://cors-anywhere.herokuapp.com/http://critique.gatech.edu/course.php?id=${courseString}`,
      type: "GET",
      dataType: "html",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "Content-Type": "text/html"
      },
      success: res => {
        // console.log(res);
        const $ = cheerio.load(res);

        let newGpa = $(
          "div.center-table > table.table > tbody:nth-child(2)",
          res
        ).text();

        newGpa = Math.round(newGpa * 100) / 100;

        // console.log(newGpa);

        setGpa(newGpa === 0 ? "N/A" : newGpa);
        setColor(newGpa);
        setUrl(
          `https://cors-anywhere.herokuapp.com/http://critique.gatech.edu/course.php?id=${courseString}`
        );
      },
      error: error => {
        // alert("Error while requesting GPA");
        setGpa("Error");
      }
    });
  };

  const setColor = value => {
    setBackground(value2color(value, 2.5, 4.0));
  };

  const value2color = (value, min, max) => {
    var base = max - min;

    if (base == 0) {
      value = 100;
    } else {
      value = ((value - min) / base) * 100;
    }
    var r,
      g,
      b = 0;
    if (value < 50) {
      r = 255;
      g = Math.round(5.1 * value);
    } else {
      g = 255;
      r = Math.round(510 - 5.1 * value);
    }
    return `rgba(${r}, ${g}, ${b}, 0.7)`;
  };

  return (
    <>
      <div className="label">Average GPA:</div>
      <div className="gpa" style={{ backgroundColor: background }}>
        {gpa}
      </div>
    </>
  );
};

export default DisplayGpa;
