const path = require('path');
const webpack = require('webpack');
const merge = require('webpack-merge');
const baseConfig = require('./webpack.config.base.js');

module.exports = merge(baseConfig, {

  mode: 'development',

  entry: {
    'index': './src/index.ts',
  },

  output: {
    // Webpackに生成したファイルの格納場所を設定
    path: path.resolve(__dirname, './dist'),
    filename: '[name].bundle.js',
    chunkFilename: '[name].bundle.js',
    // HMRに必要な設定①
    // 参照: http://dackdive.hateblo.jp/entry/2016/05/07/183335
    publicPath: '/dist'
  },

  devtool: 'source-map',

  // webpack-dev-serverの設定
  devServer: {
    contentBase: '.',
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
    // HMRに必要な設定③
    new webpack.HotModuleReplacementPlugin(),
  ],

});