'use strict'

const rollup = require('rollup')
const {uglify} = require('rollup-plugin-uglify')
const babel = require('rollup-plugin-babel')
const pkg = require('../package.json')

const isDev = process.argv.indexOf('--development') !== -1

let promise = Promise.resolve()

let dependencies = Object.assign({}, pkg.dependencies || {}, pkg.peerDependencies || {})

function getRollupOptions(plugins = []) {
  return {
    input: 'src/export.js',
    external: Object.keys(dependencies),
    plugins
  }
}

function getOutputOptions(format, filename = 'kick.js') {
  return {
    format: format,
    file: `dist/${filename}`,
    name: 'kick',
    sourcemap: !isDev
  }
}

const plugins = [babel({
  presets: [
    [
      'env',
      {
        loose: true,
        modules: false,
        targets: {browsers: ['ie 11']},
        exclude: ['babel-plugin-transform-es2015-typeof-symbol']
      }
    ]
  ],
  plugins: ['external-helpers']
})]

// Compile source code into a distributable format with Babel
promise = promise.then(() => rollup.rollup(getRollupOptions(plugins))
  .then(bundle => bundle.write(getOutputOptions('umd'))))

if (!isDev) {
  promise = promise.then(() => rollup.rollup(getRollupOptions([...plugins, uglify()]))
    .then(bundle => bundle.write(getOutputOptions('umd', 'kick.min.js'))))

  promise = promise.then(() => rollup.rollup(getRollupOptions(plugins))
    .then(bundle => bundle.write(getOutputOptions('es', 'kick.esm.js'))))
}


promise.catch(err => console.error(err.stack)) // eslint-disable-line no-console
