# separated-coverage

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
