// tslint:disable:no-console

import * as webpack from 'webpack'
import * as path from 'path'
import * as fs from 'fs'

import CircularDependencyPlugin = require('circular-dependency-plugin')
import PostCompile = require('post-compile-webpack-plugin')

import 'zotero-plugin/make-dirs'
import 'zotero-plugin/copy-assets'
import 'zotero-plugin/rdf'
import 'zotero-plugin/version'

const pkg = require('./package.json')

const target_dir = 'build/content'
const webpack_js = 'webpack.js'

const config = {
  mode: 'development',
  devtool: false,
  optimization: {
    flagIncludedChunks: true,
    usedExports: true,
    minimize: false,
    concatenateModules: false,
    emitOnErrors: false,
    moduleIds: 'named',
    chunkIds: 'named',
    runtimeChunk: {
      name: 'webpack',
    },
  },

  resolve: {
    extensions: ['.ts', '.js'],
  },

  node: false,

  resolveLoader: {
    alias: {
      'json-jsesc-loader': 'zotero-plugin/loader/json',
      'wrap-loader': 'zotero-plugin/loader/wrap',
    },
  },
  module: {
    rules: [
      { test: /\.json$/, type: 'javascript/auto', use: [ 'json-jsesc-loader' ] }, // https://github.com/webpack/webpack/issues/6572
      { test: /\.ts$/, exclude: [ /node_modules/ ], use: [ 'wrap-loader', 'ts-loader' ] },
    ],
  },

  plugins: [
    new CircularDependencyPlugin({ failOnError: true }),
    new PostCompile(() => {
      const wrapped_webpack = `${target_dir}/${webpack_js}`
      if (fs.existsSync(wrapped_webpack)) {
        let js = fs.readFileSync(`${target_dir}/${webpack_js}`, 'utf-8')

        const prefix = `if (!Zotero.webpackChunk${pkg.name.replace(/-/g, '_')}) {\n\n`
        const postfix = '\n\n}\n'

        if (!js.startsWith(prefix)) js = `${prefix}${js}${postfix}`

        fs.writeFileSync(`${target_dir}/${webpack_js}`, js)

      } else {
        console.log(`${wrapped_webpack} does not exist -- compilation error?`)

      }
    }),
  ],

  context: path.resolve(__dirname, './content'),

  entry: {
    EdTechHub: './zotero-edtechhub.ts',
  },

  output: {
    globalObject: 'Zotero',
    path: path.resolve(__dirname, `./${target_dir}`),
    filename: '[name].js',
    uniqueName: pkg.name,
    pathinfo: true,
    library: 'Zotero.[name]',
    libraryTarget: 'assign',
  },
}

export default config
