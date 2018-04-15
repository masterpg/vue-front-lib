const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.base.conf.js');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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


module.exports = merge(baseConfig, {

  mode: 'development',

  entry: {
    'index': path.resolve(__dirname, '../src/index.ts'),
    'test': path.resolve(__dirname, '../test/test.ts'),
  },

  output: {
    path: OUTPUT_PATH,
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    // HMRに必要な設定①
    // 参照: http://dackdive.hateblo.jp/entry/2016/05/07/183335
    publicPath: BASE_PATH,
  },

  devtool: 'source-map',

  // webpack-dev-serverの設定
  devServer: {
    contentBase: OUTPUT_PATH,
    port: 5000,
    host: '0.0.0.0',
    disableHostCheck: true,
    // historyApiFallbackの設定は以下URLを参照:
    // https://github.com/webpack/docs/wiki/webpack-dev-server#the-historyapifallback-option
    historyApiFallback: {
      rewrites: [],
    },
    // HMRに必要な設定②
    hot: true,
  },

  plugins: [
    new webpack.IgnorePlugin(/vertx/),

    // HMRに必要な設定③
    new webpack.HotModuleReplacementPlugin(),

    new HtmlWebpackPlugin({
      filename: 'index.html', // パスは`output.path`を基準
      template: './src/index.html',
      inject: false,
      basePath: BASE_PATH,
      bundledScript: '<script type="text/javascript" src="index.bundle.js"></script>',
    }),

    new HtmlWebpackPlugin({
      filename: 'test.html', // パスは`output.path`を基準
      template: './test/test.html',
      inject: false,
      bundledScript: '<script type="text/javascript" src="test.bundle.js"></script>',
    }),

    // `to: xxx`の`xxx`は`output.path`が基準になる
    new CopyWebpackPlugin([
      { from: 'node_modules/mocha/mocha.css', to: 'node_modules/mocha' },
      { from: 'node_modules/mocha/mocha.js', to: 'node_modules/mocha' },
      { from: 'node_modules/chai/chai.js', to: 'node_modules/chai' },
    ]),
  ],

});