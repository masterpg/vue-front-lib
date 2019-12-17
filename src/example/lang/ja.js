const merge = require('lodash/merge')

export default merge(require('@/lib/lang/ja').default, {
  common: {},
  error: {},
  sw: {
    ready: 'アプリケーションは Service Worker によってキャッシュからサーブされています。詳細は https://goo.gl/AFskqB を参照ください。',
    registered: 'Service Worker は既に登録されています。',
    cached: 'オフライン用にコンテンツがキャッシュされました。',
    updatefound: '新しいコンテンツがダウンロード中です。',
    updated: '新しいコンテンツが利用可能になりました。',
    offline: 'インターネットの接続がみつかりません。アプリケーションはオフラインモードで実行しています。',
    error: 'Service Worker の登録でエラーが発生しました: {error}',
  },
  storage: {
    uploading: 'アップロード中',
    creationNodeFailed: '{nodeType}の作成に失敗しました。',
    deletionNodeFailed: '{nodeType}の削除に失敗しました。',
    moveNodeFailed: '{nodeType}の移動に失敗しました。',
    renameNodeFailed: '{nodeType}の名前変更に失敗しました。',
    deleteItem: 'アイテム削除',
    deleteItemQ: '「{target}」を削除してよろしいですか？',
    deleteFilesQ: '{fileNum}個のファイルを削除してよろしいですか？',
    deleteFoldersQ: '{folderNum}個のフォルダを削除してよろしいですか？',
    deleteFilesAndFoldersQ: '{fileNum}個のファイルと{folderNum}個のフォルダを削除してよろしいですか？',
    movingNode: '移動{nodeType}',
    destNotSelected: '移動先が選択されていません。',
  },
})
