# Contributing

We welcome community contributions to the GT Scheduler project! Please read each of the following steps below to see how you can get started.

1. Open or assign yourself to an Issue from the GT Scheduler [website repo](https://github.com/gt-scheduler/website). Note that Issues for the [crawler](https://github.com/gt-scheduler/crawler) and [backend](https://github.com/gt-scheduler/backend) repositories are created on the website repo (and are tagged with the `cross cutting` tag) in order to track all bugs/feature requests in a single place.

    A rough overview of the tagging convention is as follows:
    - An Issue with the `bug` tag is a bug report that should include details on how to reproduce the buggy behavior
    - An Issue with the `feature request` tag is a feature request that can be addressed:
        - directly with an implementation pull request
        - or by using a separate (informal) RFC (request for comments) Issue tagged with `rfc` to facilitate design discussion and lead to an eventual implementation.
    - An Issue with the `task` tag is designed to be a well-scoped unit of work made by the project maintainers, usually in the context of [Bits of Good](https://bitsofgood.org/) development. However, if an Issue with the `task` tag also has the `work needed` tag, feel free to assign yourself to it and work on it.
2. If you are a maintainer or Bits of Good contributor with write access to the repository, feel create to create a branch directly using the described branching conventions here. For outside contributors, please fork the appropriate code repository that you are working on to your personal account.

    Then, please create a new branch named using the following format:
    ```
    [your-first-name]/[issue-#]-[slug]
    ```

    For example, if...
    - my first name was `George`
    - I assigned myself to Issue `#57`
    - Issue #57 is titled `"Add email support"`

    Then I would name my branch:
    ```
    george/57-email-support
    ```

3. Do whatever the Issue asks in your branch (whether that be implementing a new feature or fixing an existing bug)

    **Note on TypeScript**: While the crawler and backend projects are developed entirely in [TypeScript](https://www.typescriptlang.org/) (a typed superset of JavaScript), the website repo contains a mix of both JavaScript and TypeScript. Moving forwards, TypeScript is the preferred language to write new code in, so if you can, please use it when implementing a new feature.

3. Make a PR between your branch and the appropriate primary branch that links to the Issue you want to resolve. The exact branch depends on the repository you are making a PR to:
    - For the [website repo](https://github.com/gt-scheduler/website), the appropriate branch is `development`
    - For the [crawler repo](https://github.com/gt-scheduler/crawler), the appropriate branch is `master`
    - For the [backend repo](https://github.com/gt-scheduler/backend), the appropriate branch is `main`
4. Get at least one other contributor to review your PR and make comments when necessary.
5. Merge your PR once it has been approved!

If you have any questions or concerns, feel free to [open a discussion](https://github.com/gt-scheduler/website/discussions) on the GT Scheduler website repository, or for Bits of Good contributors, feel free to ask a question in the #gt-scheduler channel within the Hack4Impact slack.
