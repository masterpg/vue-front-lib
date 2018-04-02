const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {

  resolve: {
    // この拡張子のファイルをビルド対象に設定
    extensions: ['.ts', '.js', '.vue', '.json'],

    alias: {
      'vue$': 'vue/dist/vue.esm.js',
    }
  },

  module: {
    rules: [
      {
        enforce: 'pre',
        test: /\.ts?$/,
        loader: 'tslint-loader',
      },
      {
        test: /\.ts$/,
        exclude: /node_modules|vue\/src/,
        loader: 'ts-loader',
        options: {
          // 「.vue」のファイルに接尾辞「.ts」がファイル名に追加されるよう設定
          // 参照: https://github.com/TypeStrong/ts-loader#user-content-appendtssuffixto-regexp-default
          appendTsSuffixTo: [/\.vue$/]
        },
      },
      // 「.vue」ファイルをvue-loaderがハンドルするよう設定
      // 参照: https://github.com/vuejs-templates/webpack-simple/blob/master/template/webpack.config.js
      {
        test: /\.vue$/,
        loader: 'vue-loader',
        options: {
          esModule: true,
          scss: 'vue-style-loader!css-loader!sass-loader',
          loaders: {
            ts: 'ts-loader!tslint-loader'
          },
        },
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader',
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader',
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]?[hash]',
        },
      },
    ],
  },

  plugins: [
    // `to: xxx`の`xxx`は`output.path`が基準になる
    new CopyWebpackPlugin([
      {
        from: 'src/global.css',
      },
    ]),
  ],

};