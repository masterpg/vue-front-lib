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
    userRootName: 'Home',
    appRootName: 'Storage',
    uploading: 'アップロード中',
    nodeAlreadyExists: '「{nodeName}」という{nodeType}はすでに存在します。',
    create: {
      creatingDirError: '「{nodeName}」の作成でエラーが発生しました。',
    },
    delete: {
      deleteTargetQ: '「{target}」を削除してよろしいですか？',
      deleteNodeQ: '{nodeNum}個の{nodeType}を削除してよろしいですか？',
      deleteFileAndFolderQ: '{fileNum}個の{fileType}と{folderNum}個の{folderType}を削除してよろしいですか？',
      deletingError: '「{nodeName}」の削除でエラーが発生しました。',
    },
    move: {
      movingNode: '移動{nodeType}',
      selectDestPrompt: '移動先を選択してください:',
      destNotSelected: '移動先が選択されていません。',
      alreadyExistsQ: '「{nodeName}」というアイテムはすでに存在します。\n既存のアイテムは上書きされますがよろしいですか？',
      movingError: '「{nodeName}」の移動でエラーが発生しました。',
    },
    rename: {
      renamingNodeNameIsNotChanged: '名前が変更されていません。',
      renamingError: '「{nodeName}」の名前変更でエラーが発生しました。',
    },
    nodeDetail: {
      name: '名前',
      type: 'タイプ',
      size: 'サイズ',
      path: 'パス',
      url: 'URL',
      updated: '更新日',
    },
  },
})
