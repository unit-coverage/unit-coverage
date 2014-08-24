# separated-coverage

[![Build Status](https://travis-ci.org/mdevils/separated-coverage.svg?branch=master)](https://travis-ci.org/mdevils/separated-coverage) [![Coverage Status](https://coveralls.io/repos/mdevils/separated-coverage/badge.png?branch=master)](https://coveralls.io/r/mdevils/separated-coverage?branch=master) [![Dependency Status](https://david-dm.org/mdevils/separated-coverage.svg)](https://david-dm.org/mdevils/separated-coverage) [![devDependency Status](https://david-dm.org/mdevils/separated-coverage/dev-status.svg)](https://david-dm.org/mdevils/separated-coverage#info=devDependencies)

Coverage toolkit designed to collect coverage information separately for each test.

Tests and sources are split into sets, and every set coverage is calculated separately.

## Installation

```
npm install separated-coverage --save-dev
```

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
