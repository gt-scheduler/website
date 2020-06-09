import React, { useState, useEffect } from "react";
import axios from "axios";
import cheerio from "cheerio";
import $ from "jquery";
import styled from "@emotion/styled";

const DisplayGpa = props => {
  const [background, setBackground] = useState();
  const [courseId, setCourseId] = useState(props.courseId);
  const [gpa, setGpa] = useState(0);
  const [url, setUrl] = useState("");
  const errMessage = "GPA could not be accessed, try again later";

  useEffect(() => {
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
  }, []);

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
    var h = r * 0x10000 + g * 0x100 + b * 0x1;
    return "#" + ("000000" + h.toString(16)).slice(-6);
  };

  const NormalText = styled.div`
    font-weight: 500;
    display: inline-block;
    font-size: 13px;
    height: 22px;
    line-height: 18px;
  `;

  const TextBox = styled.div`
    background-color: ${background};
    width: 40px;
    height: 22px;
    margin-left: 8px;
    line-height: 19px;
    text-align: center;
    color: white;
    font-weight: 500;
    border: 2px solid #202020;
    display: inline-block;
    font-size: 13px;
  `;

  return (
    <div>
      <NormalText>Average GPA:</NormalText>
      <TextBox>{gpa}</TextBox>
    </div>
  );
};

export default DisplayGpa;
