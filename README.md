# separated-coverage

[![Build Status](https://travis-ci.org/mdevils/separated-coverage.svg?branch=master)](https://travis-ci.org/mdevils/separated-coverage) [![Coverage Status](https://coveralls.io/repos/mdevils/separated-coverage/badge.png?branch=master)](https://coveralls.io/r/mdevils/separated-coverage?branch=master) [![Dependency Status](https://david-dm.org/mdevils/separated-coverage.svg)](https://david-dm.org/mdevils/separated-coverage) [![devDependency Status](https://david-dm.org/mdevils/separated-coverage/dev-status.svg)](https://david-dm.org/mdevils/separated-coverage#info=devDependencies)

Coverage toolkit designed to collect coverage information separately for each test.

Unlike most coverage tools, `separated-coverage` keeps connection between source file and its test file.
For each source file coverage is beeing computed only when its tests are running.
This ensures you have correct test coverage for each file beeing tested.

For example you have file `source.js` and its test: `source.test.js`.
`separated-coverage` collects coverage for `source.js` only when `source.test.js` is running.

The way source file and test file are beeing linked is configurable.

## Installation

```
npm install separated-coverage --save-dev
```

## Coveralls integration example

First, install coveralls module:

```
npm install coveralls --save-dev
```

Create run script for Travis in `package.json`. Assuming you are using `mocha`, your sources are in `lib` directory and tests in `test`:

```js
"scripts": {
    "test": "...",
    "travis": "npm test && scov run -q -r lcov -a lib -s 'lib/**/*.js' -a test -t 'test/**/*.js' -- lib test | coveralls"
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
  scov run [-p <profile>] [-d <driver>] [-b <filename>] [-r <reporter>] [-f <filename>]
      [-q] [-A <name>] [-I] [-S <file-set> [-O <name> -V <val>]...]
      [-e <mask>]... [-s <mask>]... [-t <mask>]... [-a <mask>]... [-- <runner-args>...]
  scov instrument [-p <profile>] [-d <driver>] [-A <name>] [-I] [-q] [-f <filename>]
      [-S <file-set> [-O <name> -V <val>]...]
      [-e <mask>]... [-s <mask>]... [-t <mask>]... <path>...
  scov report [-p <profile>] [-a <path>]... [-e <mask>]... [-s <mask>]... [-t <mask>]...
      [-S <file-set> [-O <name> -V <val>]...]
      [-r <reporter>] <coverage-file>
  scov --version
  scov --help

Options:

  -s --sources=<mask>          Source files masks. Example: "lib/**".
  -t --tests=<mask>            Test files masks. Example: "test/**".
  -e --excludes=<mask>         Excluded file mask. Example: "lib/**.tmp.js".

  -a --additional=<path>       Additional files for the coverage report.
                               Useful when tests do not affect all the files.

  -b --bin=<filename>          Specifies executable file for test driver.
  -d --driver=<driver>         Specifies driver [default: mocha].

  -r --reporter=<name>         Reporer name: html, lcov, summary, teamcity, tree [default: tree].
  -f --file=<filename>         Saves "json"-coverage information to specified file.

  -p --profile=<profile>       Reads profile from "package.json".

  -o --output=<filename>       Report output filename.

  -X --no-export               Do not include json-save action into instrumented file.

  -S --set=<set>               File set. Test name source for input files [default: basename].
  -O --set-opt=<name>          File set option name.
  -V --set-opt-val=<val>       File set option value.

  -A --api-object-name=<name>  Export API to an object in instrumented files.

  -I --include-init-coverage   Includes initialization coverage information.

  -q --quiet                   Runs quietly.

  --help                       Show this screen.
  --version                    Show version.

```
