const CopyWebpackPlugin = require('copy-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const path = require('path')

// ベースURLの設定
const publicPath = process.env.VUE_APP_BASE_URL

// 各エントリーポイントの設定
const pages = {
  index: {
    // entry for the page
    entry: 'src/app/index.ts',
    // the source template
    template: 'src/app/index.html',
    // output as dist/playground.html
    filename: 'index.html',
    // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
    title: 'vue-front-lib Example',
  },
}
if (process.env.VUE_APP_IS_DEVELOPMENT === 'true') {
  Object.assign(pages, {
    playground: {
      entry: 'src/app/playground.ts',
      template: 'src/app/playground.html',
      filename: 'playground.html',
      title: 'vue-front-lib Playground',
    },
  })
}

// Vue CLI Configuration Reference
// https://cli.vuejs.org/config/
module.exports = {
  publicPath,

  pages,

  transpileDependencies: [
    /[\\/]node_modules[\\/]quasar[\\/]/,
  ],

  pluginOptions: {
    quasar: {
      rtlSupport: true,
      treeShake: true,
    },
  },

  // Firebase Hostingでハッシュ付きのファイルを使用すると、
  // Service Workerで不具合が生じ、新しいリソースがキャッシュできなかったり、
  // 画面ロード時にリソースをうまく見つけられずエラーが発生したりする。
  // このためファイル名にハッシュをつけないよう設定している。
  filenameHashing: false,

  pwa: {
    name: 'vue-base-project',
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/manifest/apple-touch-icon-152x152.png',
      maskIcon: 'img/icons/manifest/safari-pinned-tab.svg',
      msTileImage: 'img/icons/manifest/msapplication-icon-144x144.png',
    },
    // Workbox webpack Plugins
    // https://developers.google.com/web/tools/workbox/modules/workbox-webpack-plugin
    workboxOptions: {
      // skipWaitingについては以下を参照
      // https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=ja#updates
      skipWaiting: true,

      // ServiceWorkerインストール時にキャッシュされるファイルを設定
      include: [/\.html$/, /\.js$/, /\.css$/, /^favicon\.ico$/, /^img\/(?:[^/]+\/)*[^/]+\.(?:jpg|jpeg|png|gif|bmp|svg)$/],
      exclude: [/\.map$/],

      // ※ 以下のような不具合があったが、`filenameHashing`の対応を行ったところ、
      //    問題が解決したかもしれないので一旦コメント化。
      //    今後状況をみて削除するか検討すること。
      //
      // index.htmlをServiceWorkerでキャッシュすると、
      // FirebaseのGoogleやFacebook認証がうまく動作しなくなるので除外。
      // exclude: [/^index\.html$/, /\.map$/],

      // `/`以下のパスで存在しないファイルまたはディレクトリが
      // 指定された場合にindex.htmlへフォールバックするよう設定
      navigateFallback: '/index.html',
      navigateFallbackWhitelist: [/^\//],

      // フェッチ時にキャッシュされるパスを設定
      runtimeCaching: [
        {
          urlPattern: /\/api\//,
          handler: 'networkFirst',
        },
      ],
    },
  },

  chainWebpack: config => {
    // Vue I18n 単一ファイルコンポーネントの設定
    // http://kazupon.github.io/vue-i18n/guide/sfc.html
    config.module
      .rule('i18n')
      .resourceQuery(/blockType=i18n/)
      .type('javascript/auto')
      .use('i18n')
        .loader('@kazupon/vue-i18n-loader')
        .end()
      .use('yaml')
        .loader('yaml-loader')
        .end()

    // 必要なリソースファイルのコピー
    let copyFiles = [
      {from: 'node_modules/@webcomponents/webcomponentsjs/**/*.js'},
      {from: 'node_modules/firebase/firebase-*.js'},
    ]
    if (process.env.VUE_APP_IS_DEVELOPMENT === 'true') {
      copyFiles = [
        ...copyFiles,
        // その他必要であれば追記
        // 例: {from: 'node_modules/aaa/bbb.css', to: 'node_modules/aaa'},
      ]
    }
    config
      .plugin('copy-prod')
        .use(CopyWebpackPlugin, [copyFiles])
        // 参照: https://github.com/vuejs/vue-cli/blob/c76d2e691d8ea58b219394ca7799f50d873b8588/packages/%40vue/cli-service/lib/commands/build/resolveAppConfig.js#L7
        .after('copy')

    // Monaco Editor
    // https://github.com/microsoft/monaco-editor-webpack-plugin
    config
      .plugin('monaco')
      .use(MonacoWebpackPlugin)

    // テキストファイルのインポート
    config.module
      .rule('raw')
      .test(/\.txt|.md$/i)
      .use('raw-loader')
        .loader('raw-loader')
        .end()
  },

  devServer: {
    port: 5000,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
}
