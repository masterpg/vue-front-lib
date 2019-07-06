const CopyWebpackPlugin = require('copy-webpack-plugin')
const path = require('path')

// ベースURLの設定
const baseUrl = process.env.VUE_APP_BASE_URL

// 各エントリーポイントの設定
const pages = {
  index: {
    // entry for the page
    entry: 'src/index.ts',
    // the source template
    template: 'src/index.html',
    // output as dist/playground.html
    filename: 'index.html',
    // template title tag needs to be <title><%= htmlWebpackPlugin.options.title %></title>
    title: 'Vue Base Project',
  },
}
if (process.env.VUE_APP_IS_DEVELOPMENT === 'true') {
  Object.assign(pages, {
    playground: {
      entry: 'src/playground.ts',
      template: 'src/playground.html',
      filename: 'playground.html',
      title: 'Vue Base Project Playground',
    },
  })
}

module.exports = {
  baseUrl,

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

  pwa: {
    name: 'vue-base-project',
    iconPaths: {
      favicon32: 'img/icons/manifest/favicon-32x32.png',
      favicon16: 'img/icons/manifest/favicon-16x16.png',
      appleTouchIcon: 'img/icons/manifest/apple-touch-icon-152x152.png',
      maskIcon: 'img/icons/manifest/safari-pinned-tab.svg',
      msTileImage: 'img/icons/manifest/msapplication-icon-144x144.png',
    },
    workboxOptions: {
      // skipWaitingについては以下を参照
      // https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle?hl=ja#updates
      skipWaiting: true,

      // ServiceWorkerインストール時にキャッシュされるファイルを設定
      include: [/\.html$/, /\.js$/, /\.css$/, /^favicon\.ico$/],
      exclude: [/\.map$/],

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
        {
          urlPattern: /\/img\//,
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
    let copyFiles = [{from: 'node_modules/@webcomponents/webcomponentsjs/**/*.js'}]
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
        .after('copy')
  },

  devServer: {
    port: 5000,
    host: '0.0.0.0',
    disableHostCheck: true,
    proxy: {
      '/api': {
        target: 'http://0.0.0.0:5010',
        secure: false,
      },
    },
  },
}
