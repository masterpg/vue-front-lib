const CopyWebpackPlugin = require('copy-webpack-plugin')
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin')
const path = require('path')

// ベースURLの設定
const publicPath = process.env.VUE_APP_BASE_URL ?? ''

// 各エントリーポイントの設定
const pages = {
  index: {
    // entry for the page
    entry: 'src/app/index.ts',
    // the source template
    template: 'src/app/index.html',
    // output as dist/index.html
    filename: 'index.html',
    // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
    title: 'vue-front-lib',
  },
}
Object.assign(pages, {
  demo: {
    entry: 'src/demo/index.ts',
    template: 'src/demo/index.html',
    filename: 'demo.html',
    title: 'vue-front-lib demo',
  },
})

// Vue CLI Configuration Reference
// https://cli.vuejs.org/config/
module.exports = {
  pluginOptions: {
    quasar: {
      importStrategy: 'manual',
      rtlSupport: false,
    },
  },
  transpileDependencies: ['quasar'],

  publicPath,

  pages,

  // Firebase Hostingでハッシュ付きのファイルを使用すると、
  // Service Workerで不具合が生じ、新しいリソースがキャッシュできなかったり、
  // 画面ロード時にリソースをうまく見つけられずエラーが発生したりする。
  // このためファイル名にハッシュをつけないよう設定している。
  filenameHashing: false,

  pwa: {
    name: 'vue-front-lib',
    iconPaths: {
      favicon32: 'img/icons/favicon-32x32.png',
      favicon16: 'img/icons/favicon-16x16.png',
      appleTouchIcon: 'img/icons/manifest/apple-touch-icon-152x152.png',
      maskIcon: 'img/icons/manifest/safari-pinned-tab.svg',
      msTileImage: 'img/icons/manifest/msapplication-icon-144x144.png',
    },
    // Workbox webpack Plugins
    // https://developers.google.com/web/tools/workbox/reference-docs/latest/module-workbox-webpack-plugin.GenerateSW#GenerateSW
    workboxOptions: {
      // skipWaitingについては以下を参照
      // https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=ja#updates
      skipWaiting: true,

      // ServiceWorkerインストール時にキャッシュされるファイルを設定
      include: [/\.html$/, /\.js$/, /\.css$/, /^favicon\.ico$/, /^img\/(?:[^/]+\/)*[^/]+\.(?:jpg|jpeg|png|gif|bmp|svg)$/, /^fonts\/(?:[^/]+\/)*[^/]+\.woff2?$/],
      exclude: [/\.map$/],

      // `/`以下のパスで存在しないファイルまたはディレクトリが
      // 指定された場合にindex.htmlへフォールバックするよう設定
      navigateFallback: `${path.join(publicPath, '/index.html')}`,

      // フェッチ時にキャッシュされるパスを設定
      runtimeCaching: [
        {
          urlPattern: /\/api\//,
          handler: 'NetworkFirst',
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
      { from: 'node_modules/firebase/firebase-*.js' },
    ]
    if (process.env.VUE_APP_IS_DEVELOPMENT === 'true') {
      copyFiles = [
        ...copyFiles,
        // その他必要であれば追記
        // 例: { from: 'node_modules/aaa/bbb.css', to: 'node_modules/aaa' },
      ]
    }
    config
      .plugin('copy-prod')
      // 参照: https://github.com/vuejs/vue-cli/blob/c76d2e691d8ea58b219394ca7799f50d873b8588/packages/%40vue/cli-service/lib/commands/build/resolveAppConfig.js#L7
      .after('copy')
      .use(CopyWebpackPlugin, [copyFiles])

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
    port: 5030,
    host: '0.0.0.0',
    disableHostCheck: true,
  },
}
