# unit-coverage

[![Build Status](https://travis-ci.org/unit-coverage/unit-coverage.svg?branch=master)](https://travis-ci.org/unit-coverage/unit-coverage) [![Coverage Status](https://coveralls.io/repos/unit-coverage/unit-coverage/badge.png?branch=master)](https://coveralls.io/r/unit-coverage/unit-coverage?branch=master) [![Dependency Status](https://david-dm.org/unit-coverage/unit-coverage.svg)](https://david-dm.org/unit-coverage/unit-coverage) [![devDependency Status](https://david-dm.org/unit-coverage/unit-coverage/dev-status.svg)](https://david-dm.org/unit-coverage/unit-coverage#info=devDependencies)

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

You could ask: what is the use of yet another JS coverage tool? `unit-coverage` was born out of the discussion about
the correctness of the current coverage tools: what exactly is beeing measured by most coverage tools available?

In most coverage tools you can find at least three metrics:

* Covered lines during all the tests.
* Covered branches during all the tests.
* Covered functions during all the tests.

You run tests under coverage tool and you receive a report saying how many lines, branches and functions are
covered in a whole test run. This report tells you which lines were affected and which were not.

But there is no information about a specific test.

For example, you have two classes: `User` and `Group`. You run your favourite JS-coverage tool to generate a report.
Looking at the report you cannot answer: how the test for the class `User` covers `User` class's
lines/branches/functions. If there is a test for the class `Group` and `Group` is using `User`, the `User`-class line
coverage will be affected during the `Group`-class's tests. Even if you do not have any tests for specific classes,
you may get unwanted coverage from the other tests.

In other words, most coverage tools dump their coverage data in a huge heap.

At this point you may have a question: what do I want from a coverage tool?
Here `unit-coverage` have its own answer: **coverage must represent the quality of the tests**.

This is example how **most coverage tools** work:

![](https://raw.githubusercontent.com/unit-coverage/unit-coverage/master/doc/single-other.png)

You only have test for the class `A`, but receive coverage from used but not tested classes: `B` and `C`.

When later you introduce the tests for `B` and `C`, you get a mess:

![](https://raw.githubusercontent.com/unit-coverage/unit-coverage/master/doc/multiple-other.png)

In this report you cannot say: how good is the test for `A`? How good is the test for `B`?
And what about the `C`-test?

With `unit-coverage` we implemented another strategy. Having a single test for `A` you only get a report
containing `A`-coverage information:

![](https://raw.githubusercontent.com/unit-coverage/unit-coverage/master/doc/single-unit-coverage.png)

And when you fill up your project with more tests:

![](https://raw.githubusercontent.com/unit-coverage/unit-coverage/master/doc/multiple-unit-coverage.png)

You still get desired coverage information.

That's the idea: `unit-coverage` lets you know how good your tests are.

## Matching test and source file

To let `unit-coverage` do the job at its best, you should choose a matching method, which specifies a mapping between
a source file and its tests file. We call it `File Set`.

There is a CLI option to specify the required `File Set`: `--set <file-set>` (shortcut: `-S`).
Some `File Sets` requires configuration. You can use `--set-opt <name>=<val>`(shortcut: `-O`).

Available `File Sets`:

* `basename` (default): matches source and test files when they have equal file name (excluding extension).
  Works for simple projects.
* `simple`: matches everything to everything (this is how most coverage tools work). Introduced for testing purposes.
* `relative`: matches source and test files when they are located in different but equal directory subtrees.
  For example, you can match the source file `src/lib/class.js` to its test at `test/lib/class.js`.

Mode `relative` has several options:

* `sources` directory where are the tests located (project root if omitted).
* `tests` directory where are the tests located (project root if omitted).
* `suffix` suffix, which will be removed from file names during the match.

`relative` mode example:

```sh
unit-coverage run -s 'src/**' -t 'test/**' -S relative -O sources=src -O tests=test -- --recursive src test
```

## Coveralls integration example

Coveralls works with your continuous integration server to give you test coverage history and statistics.
It is free for open source projects. Website: https://coveralls.io

We use Coveralls to track coverage changes over pull-requests.

Having enabled Coveralls and Travis for your project, install Coveralls module:

```
npm install coveralls --save-dev
```

Create run script for Travis in `package.json`. Assuming you are using `mocha`,
your sources are in `lib` directory and tests in `test`:

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

* More about Coveralls: https://coveralls.io/
* More about Coveralls npm package: https://github.com/cainus/node-coveralls
* More about Travis CI: https://travis-ci.org/

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

  -r --reporter=<name>         Reporer name: html, lcov, summary, teamcity, clover, tree [default: tree].

  -o --output=<filename>       Report output filename.

  -f --file=<filename>         Saves "json"-coverage information to specified file.

  -X --no-export               Do not include json-save action into instrumented file.

  -p --profile=<profile>       Reads profile from "package.json".

  -S --set=<set>               File set. Test name source for input files [default: simple].

  -O --set-opt <name>=<val>    File set option.

  -A --api-object-name=<name>  Export API to an object in instrumented files.

  -I --include-init-coverage   Includes initialization coverage information.

  -q --quiet                   Runs quietly.

  --help                       Show this screen.

  --version                    Show version.
```
