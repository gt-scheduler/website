# Change Log

All notable changes to this project will be documented in this file.

## Future Features and Fixes

- Weighted Average calculation using the selected professors and sections
- Insertable blocks of time on calendar where no class schedules contained specified time will be shown
- More data sources to get course information and descriptions
- More visualization options

# Version History

## Release 2.1.0

#### New Chart Style

- Replaced the CanvasJS chart module with recharts for open source graphs
- Cummulative GPA is calculated using the corresponding instuctor GPA averages instead of course average

## Release 2.0.0

#### UI Refresh and Improvements

- Dark Mode Support across the entire user interface
- Material Design Scheme using shadow styles on columns and course calendar blocks
- Smooth transition between dark and light modes
- Smoothened transition of button brightness when hovered

#### Course Critique Integration

- Course Critique engine added to scrape contents of the selected course's respective [Georgia Tech Course Critique](https://critique.gatech.edu/) webpage
- UI displayed a color coded box around the course's GPA depending on the GPA value
- Next to Professor names when section list expanded, Average GPA is displayed for the respective professor
- When Course information tab is selected, Graphical visualization of the grade distributions for the Course Average and all selected professors is shown
- Calculated weighted average for all courses by number of credit hours is show on the bottom of the courses column

## [Earlier Releases](https://github.com/64json/gt-scheduler/commits/master)

View earlier commits to this repository from the above link.
