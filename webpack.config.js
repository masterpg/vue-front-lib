const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',

  // ビルドの起点となるファイルパスを設定。
  // このファイルからrequireされているファイルが芋づる式に取得されることになる。
  entry: {
    'index': './src/index.ts'
  },

  output: {
    // Webpackに生成したファイルの格納場所を設定
    path: path.resolve(__dirname, './dist'),
    filename: 'bundle.js',
    // HMRに必要な設定①
    // 参照: http://dackdive.hateblo.jp/entry/2016/05/07/183335
    publicPath: '/dist'
  },

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
        loader: 'tslint-loader'
      },
      {
        test: /\.ts$/,
        exclude: /node_modules|vue\/src/,
        loader: 'ts-loader',
        options: {
          // 「.vue」のファイルに接尾辞「.ts」がファイル名に追加されるよう設定
          // 参照: https://github.com/TypeStrong/ts-loader#user-content-appendtssuffixto-regexp-default
          appendTsSuffixTo: [/\.vue$/]
        }
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
          }
        }
      },
      {
        test: /\.css$/,
        loader: 'style-loader!css-loader'
      },
      {
        test: /\.(eot|svg|ttf|woff|woff2)(\?\S*)?$/,
        loader: 'file-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?\S*)?$/,
        loader: 'file-loader',
        query: {
          name: '[name].[ext]?[hash]'
        }
      }
    ]
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
  ]

};