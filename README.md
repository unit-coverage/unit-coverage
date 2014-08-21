# separated-coverage

[![Build Status](https://travis-ci.org/mdevils/separated-coverage.svg?branch=master)](https://travis-ci.org/mdevils/separated-coverage) [![Coverage Status](https://coveralls.io/repos/mdevils/separated-coverage/badge.png?branch=master)](https://coveralls.io/r/mdevils/separated-coverage?branch=master) [![Dependency Status](https://david-dm.org/mdevils/separated-coverage.svg)](https://david-dm.org/mdevils/separated-coverage) [![devDependency Status](https://david-dm.org/mdevils/separated-coverage/dev-status.svg)](https://david-dm.org/mdevils/separated-coverage#info=devDependencies)

Coverage toolkit designed to collect coverage information separately for each test.

Tests and sources are split into sets, and every set coverage is calculated separately.

## Installation

```
npm install separated-coverage --save
```

## Instrumentation

Instrumentation is done using API. This tool is designed to be used from custom build tools.

It uses built-in source map.

## CLI Usage

Run mocha-phantom

```
node_modules/.bin/separated-coverage run node_modules/.bin/mocha-phantomjs -R dot test/client/test.html
```

Run mocha

```
node_modules/.bin/separated-coverage run-mocha --bin node_modules/.bin/mocha --sources 'lib/**' --tests 'test/**'
```

Generate report

```
node_modules/.bin/separated-coverage report --input coverage.json --reporter html > 1.html && open 1.html
```
