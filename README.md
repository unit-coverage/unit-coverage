# unit-coverage

[![Build Status](https://travis-ci.org/mdevils/unit-coverage.svg?branch=master)](https://travis-ci.org/mdevils/unit-coverage) [![Coverage Status](https://coveralls.io/repos/mdevils/unit-coverage/badge.png?branch=master)](https://coveralls.io/r/mdevils/unit-coverage?branch=master) [![Dependency Status](https://david-dm.org/mdevils/unit-coverage.svg)](https://david-dm.org/mdevils/unit-coverage) [![devDependency Status](https://david-dm.org/mdevils/unit-coverage/dev-status.svg)](https://david-dm.org/mdevils/unit-coverage#info=devDependencies)

Coverage toolkit designed to collect coverage information separately for each test.

Unlike most coverage tools, `unit-coverage` keeps connection between source file and its test file.
For each source file coverage is beeing computed only when its tests are running.
This ensures you have correct test coverage for each file beeing tested.

For example you have file `source.js` and its test: `source.test.js`.
`unit-coverage` collects coverage for `source.js` only when `source.test.js` is running.

The way source file and test file are beeing linked is configurable.

## Installation

```
npm install unit-coverage --save-dev
```

## The idea

You could ask: what is the use of yet another JS coverage tool? `unit-coverage` was born in the discussion about
correctness of the current coverage tools: what exactly is beeing measured by the most coverage tools available?

In most coverage tools you can find at least three metrics:

* Covered lines during all the tests.
* Covered branches during all the tests.
* Covered functions during all the tests.

You run the tests under coverage tool and you receive a report saying how many lines, branches and functions are
covered in the whole test run. This report tells you which lines were affected and which were not.

But there is no information about the specific test.

For example, looking at the report you cannot answer: how the test for the class `User` covers `User` class's
lines/branches/functions. If there is a test for the class `Group` and `Group` is using `User`, the `User`-class line
coverage will be affected during the `Group`-class tests. Even if you do not have tests for specific classes, you may
get unwanted coverage from the other tests.

In other words, most coverage tools dump their coverage data in a huge heap.

At this point you may have a question: what do I want from a coverage tool?
Here `unit-coverage` have its own answer: **coverage must represent the quality of the tests**.

This is example how **most coverage tools** work:

![](https://raw.githubusercontent.com/mdevils/unit-coverage/master/doc/single-other.png)

You only have test for the class `A`, but receive coverage from used but not tested classes: `B` and `C`.

When later you introduce tests for `B` and `C`, you get a mess:

![](https://raw.githubusercontent.com/mdevils/unit-coverage/master/doc/multiple-other.png)

In this report you cannot say: how good is the test for `A`? How good is test for `B`? And what about `C`-test?

With `unit-coverage` we implemented another strategy. Having a single test for `A` you only get a report
with `A`-coverage information:

![](https://raw.githubusercontent.com/mdevils/unit-coverage/master/doc/single-unit-coverage.png)

And when you fill your project with more tests:

![](https://raw.githubusercontent.com/mdevils/unit-coverage/master/doc/multiple-unit-coverage.png)

You still get the desired coverage information.

That's the idea: `unit-coverage` let you know how good your tests are.

## Coveralls integration example

First, install coveralls module:

```
npm install coveralls --save-dev
```

Create run script for Travis in `package.json`. Assuming you are using `mocha`, your sources are in `lib` directory and tests in `test`:

```js
"scripts": {
    "test": "...",
    "travis": "npm test && unit-coverage run -q -r lcov -a lib -s 'lib/**/*.js' -a test -t 'test/**/*.js' -- lib test | coveralls"
}
```

Change default Travis action from `npm test` to `npm run travis` in `.travis.yml`:

```yaml
language: node_js
script: "npm run travis"
#...
```

More about `coveralls`: https://coveralls.io/
More about `coveralls` npm package: https://github.com/cainus/node-coveralls

## CLI Usage

```
Usage:

  unit-coverage run [-p <profile>] [-d <driver>] [-b <filename>] [-r <reporter>] [-f <filename>]
      [-q] [-A <name>] [-I] [-S <file-set> [-O <name>]...] [-o <filename>]
      [-e <mask>]... [-s <mask>]... [-t <mask>]... [-a <mask>]... [-- <runner-args>...]

  unit-coverage instrument [-p <profile>] [-d <driver>] [-A <name>] [-I] [-q] [-f <filename>]
      [-S <file-set> [-O <name>]...]
      [-e <mask>]... [-s <mask>]... [-t <mask>]... <path>...

  unit-coverage report [-p <profile>] [-a <path>]... [-e <mask>]... [-s <mask>]... [-t <mask>]...
      [-q] [-S <file-set> [-O <name>]...]
      [-r <reporter>] [-o <filename>] <coverage-file>

  unit-coverage --version

  unit-coverage --help

Options:

  -s --sources=<mask>          Source files masks. Example: "lib/**".

  -t --tests=<mask>            Test files masks. Example: "test/**".

  -e --excludes=<mask>         Excluded file mask. Example: "lib/**.tmp.js".

  -a --additional=<path>       Additional files for the coverage report.
                               Useful when tests do not affect all the files.

  -b --bin=<filename>          Specifies executable file for test driver.

  -d --driver=<driver>         Specifies driver [default: mocha].

  -r --reporter=<name>         Reporer name: html, lcov, summary, teamcity, tree [default: tree].

  -o --output=<filename>       Report output filename.

  -f --file=<filename>         Saves "json"-coverage information to specified file.

  -X --no-export               Do not include json-save action into instrumented file.

  -p --profile=<profile>       Reads profile from "package.json".

  -S --set=<set>               File set. Test name source for input files [default: basename].

  -O --set-opt <name>=<val>    File set option.

  -A --api-object-name=<name>  Export API to an object in instrumented files.

  -I --include-init-coverage   Includes initialization coverage information.

  -q --quiet                   Runs quietly.

  --help                       Show this screen.

  --version                    Show version.
```
