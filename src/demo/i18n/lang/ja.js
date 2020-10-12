import merge from 'lodash/merge'

export default merge(require('@/app/i18n/lang/ja').default, {
  app: {
    updated: 'アプリケーションが更新されました。',
  },
  abc: {
    hello: 'こんにちは、{name}さん。',
    today: '今日は {date} です。',
  },
  shop: {
    products: '商品一覧',
    yourCurt: 'あなたのカート',
    price: '価格',
    stock: '在庫',
    total: '合計',
    checkout: 'チェックアウト',
  },
  serviceWorker: {
    ready: 'ServiceWorkerが起動しました。',
    installing: 'ServiceWorkerをインストールしています。',
    updating: 'ServiceWorkerを更新しています。',
    installed: 'ServiceWorkerがインストールされました。',
    updated: 'ServiceWorkerが更新されました。',
    offline: 'サーバーへ接続できないため、ServiceWorkerはオフラインモードで実行しています。',
    error: 'ServiceWorkerの登録でエラーが発生しました.',
  },
})
