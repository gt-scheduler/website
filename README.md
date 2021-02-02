# GT Scheduler
> Georgia Tech Scheduler lets you find the schedule that fits you best among all the possible combinations of courses.

## License & Copyright Notice

This work is a derivative of the original and spectacular [GT Scheduler](https://github.com/64json/gt-scheduler) project created by Jinseo Park. The original work and all modifications are licensed under the [AGPL v3.0](https://github.com/64json/gt-scheduler/blob/master/LICENSE) license.

### Original Work

Copyright (c) 2020 Jinseo Park (parkjs814@gmail.com)

### Modifications

Copyright (c) 2020 the Bits of Good "GT Scheduler" team

## 🚀 Running Locally

To run the GT scheduler app locally and start contributing new features/bugfixes, there are a few steps you'll need to complete; mainly:

1. Installing a handful of development tools
2. Cloning the Git repository from GitHub to your local computer via `git`
3. Installing packages via `yarn`
4. Running a local development version of the app

### Getting Started - Development Tools

The project requires a small handful of tools that are used to develop both the frontend (this repository) and the scraper/crawler scripts that are used to fetch course data (at [GTBitsOfGood/gt-schedule-crawler](https://github.com/GTBitsOfGood/gt-schedule-crawler)).

The list of software that you'll need to have installed is:

- [`git`](https://git-scm.com/) - `git` is the tool we use to track changes made by multiple people to the codebase. If you've taken a CS class like CS 2340 or something similar you likely already have it installed and are familiar with it, but in case you aren't, you can [download it from their website](https://git-scm.com/downloads) and learn more about using it using some of the brief starter guides available online (personally, I really like [this one](https://rogerdudler.github.io/git-guide/) I often come back to it as a reference).
  - Even if you already have Git installed, it might be worth reviewing the [GT Bits of Good branching conventions](https://www.notion.so/Branch-Conventions-fa4d056e31bd4242a2d0ffee959de92d), specifically that:
    > 4. All feature branches must use the following naming convention:
    >  - `[NAME]/[ISSUE-NUMBER]-[SHORT_DESCRIPTION]` (Issue number is optional)
    >  - i.e `daniel/48-setup-ci`
- [Node.js](https://nodejs.org/en/) - Node.js is a JavaScript runtime that exists on your computer as a standalone tool (as opposed to being embedded in a browser) and is used to run various JavaScript scripts to build the frontend code and manage dependencies before it ever hits your browser.
  - If you already have a version of Node.js installed (you can check by opening a terminal and running `node --version`), and it ends up causing strange errors when building the app (especially if it's older), you may want to either uninstall the old version or look into a tool like [`nvm`](https://github.com/nvm-sh/nvm) that lets you have multiple versions of Node.js installed (you only need this if you encounter issues or want multiple versions installed for some other purpose).
- [`yarn`](https://classic.yarnpkg.com/en/docs/install/) - We use Yarn to manage dependencies and download packages that are used in the frontend. To install it, you can use the `npm` utility that was installed alongside with Node:

  ~~~
  npm install --global yarn
  ~~~
- A text editor/IDE. You most likely already have one installed, but in case you don't, we recommend using [Visual Studio Code](https://code.visualstudio.com/) since it's easy to use and has a wide set of powerful plugins. It can be downloaded from their [downloads page](https://code.visualstudio.com/Download).

### Downloading the Code - Cloning

To download the code, you'll need to clone the Git repository to your local computer. With a new terminal open and inside of whatever folder you'd like to have your repository folder in, run:

```
git clone https://github.com/gt-scheduler/website.git gt-scheduler
cd gt-scheduler
```

This will create a new folder called `gt-scheduler` that will have the downloaded code in, and switches the current directory to that folder.

### Installing Dependencies

To install the dependencies needed to run the project locally, you'll use Yarn. In the same terminal that you cloned the repository with, run:

```
yarn install
```

This may take a couple minutes and will create a new folder called `node_modules` with all of the dependencies installed within.

### Running

Once all of the above steps have been taken, you can start a local development version of the frontend app by running:

```
yarn start
```

The app should then be viewable at [http://localhost:3000/gt-scheduler](http://localhost:3000/gt-scheduler), which you can open a new browser tab to view.

With that, you're able to make changes to the code and have them be re-built and viewable after a short delay in the same tab. This is the main workflow for adding new features or fixing bugs and testing them in the actual app.
