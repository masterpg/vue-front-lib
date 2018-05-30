const base = require('./webpack.base.conf.js');
const path = require('path');
const merge = require('webpack-merge');

/**
 * ターゲット環境
 */
const TARGET_ENV = 'staging';

/**
 * 基準パス
 * 例: /boo/foo/woo/ (パスの最初と最後は"/"をつけること)
 */
const BASE_PATH = '/';

/**
 * ビルド結果の出力パス
 */
const OUTPUT_PATH = path.resolve(__dirname, path.join('../.dist', BASE_PATH));

module.exports = merge(base.config(TARGET_ENV, BASE_PATH, OUTPUT_PATH), {
  plugins: [
    base.newSWPrecacheWebpackPlugin(BASE_PATH, OUTPUT_PATH),
    base.newImageminPlugin(),
  ],
});
