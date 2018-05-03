const path = require('path');
const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const ImageminPlugin = require('imagemin-webpack-plugin').default;

/**
 * キャッシュディレクトリ
 */
const CACHE_DIR = '.cache';

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
        test: /\.styl$/,
        loader: ['style-loader', 'css-loader', 'stylus-loader'],
      },
    ],
  },

  plugins: [
    // `to: xxx`の`xxx`は`output.path`が基準になる
    new CopyWebpackPlugin([
      {
        from: path.resolve(__dirname, '../src/manifest.json'),
      }, {
        from: path.resolve(__dirname, '../src/assets/images'),
        to: 'assets/images',
      }
    ]),

    new ImageminPlugin({
      test: /assets\/images\/[^\.]+\.(jpe?g|png|gif|svg)$/i,
      cacheFolder: CACHE_DIR,
    }),
  ],

};