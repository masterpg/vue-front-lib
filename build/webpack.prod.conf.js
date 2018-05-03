const baseConfig = require('./webpack.base.conf.js');
const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const SWPrecacheWebpackPlugin = require('sw-precache-webpack-plugin');

/**
 * 基準パス
 * 例: /boo/foo/woo/ (パスの最初と最後は"/"をつけること)
 */
const BASE_PATH = '/';

/**
 * ビルド結果の出力パス
 */
const OUTPUT_PATH = path.resolve(__dirname,
  path.join('../.dist', BASE_PATH));

/**
 * キャッシュディレクトリ
 */
const CACHE_DIR = '.cache';

module.exports = merge(baseConfig, {

  mode: 'production',

  entry: {
    'index': path.resolve(__dirname, '../src/index.ts'),
  },

  output: {
    path: OUTPUT_PATH,
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    publicPath: BASE_PATH,
  },

  plugins: [
    new CleanWebpackPlugin(
      [OUTPUT_PATH, CACHE_DIR],
      {
        root: path.resolve(__dirname , '..'),
        verbose: true
      },
    ),

    new HtmlWebpackPlugin({
      filename: 'index.html',  // パスは`output.path`を基準
      template: './src/index.html',
      inject: true,
      basePath: BASE_PATH,
      bundledScript: '',
    }),

    new SWPrecacheWebpackPlugin({
      staticFileGlobs: [
        path.join(OUTPUT_PATH, BASE_PATH, 'node_modules/**/*'),
        path.join(OUTPUT_PATH, BASE_PATH, 'assets/**/*'),
        path.join(OUTPUT_PATH, BASE_PATH, '*.bundle.js'),
        path.join(OUTPUT_PATH, BASE_PATH, 'index.html'),
        path.join(OUTPUT_PATH, BASE_PATH, 'manifest.json'),
      ],
      navigateFallback: 'index.html',
      navigateFallbackWhitelist: [/^(?!\/api\/).*$/],
      stripPrefix: path.join(OUTPUT_PATH, BASE_PATH),
    }),
  ],

});
