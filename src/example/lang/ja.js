import merge from 'lodash/merge'

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
  auth: {
    signInFailed: 'サインインに失敗しました。',
    signUpFailed: 'ユーザー登録に失敗しました。',
    authFailedCode: {
      wrongPassword: 'パスワードが無効か、メールアドレスが存在しません。',
      userNotFound: 'パスワードが無効か、メールアドレスが存在しません。',
      tooManyRequests: '認証処理に失敗しました。少し時間をおいて試してください。',
      emailAlreadyInUse: 'メールアドレスはすでに別のアカウントで使用されています。',
    },
    emailVerifying: 'メールアドレス検証中',
    emailVerifyingMsg: '"{email}"を検証するためにメールを送信しました。メールの指示にしたがってください。',
    emailUnverifiedMsg: '"{email}"はまだ検証が行われていません。',
    forgotPassword: 'パスワードを忘れましたか？',
    resetPassword: 'パスワードのリセット',
    restPasswordSendMsg: 'パスワードをリセットするためのメールを送信します。',
    restPasswordSentMsg: '"{email}"にメールを送信しました。メールの指示にしたがってパスワードをリセットしてください。',
    deleteUser: 'ユーザー削除',
    deleteUserMsg: '削除したユーザーはもとに戻すことができません。ユーザーを削除してもよろしいですか？',
    deleteUserSignInMsg: '一定期間サインインが行われていなかったため、サインインする必要があります。',
    changeEmail: 'メールアドレス変更',
    entry: {
      userInfo: 'ユーザー情報',
      fullName: '名前',
    },
    providerList: {
      withGoogle: 'Googleで{type}',
      withFacebook: 'Facebookで{type}',
      withEmail: 'メールアドレスで{type}',
      withAnonymous: 'ゲストで{type}',
    },
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
    share: {
      sharingNode: '共有する{nodeType}',
      selectPublicPrompt: '{nodeType}を公開するか選択してください:',
      notSet: '未設定',
      public: '公開',
      private: '非公開',
      sharingError: '「{nodeName}」の共有でエラーが発生しました。',
    },
    nodeDetail: {
      name: '名前',
      type: 'タイプ',
      size: 'サイズ',
      share: '共有',
      path: 'パス',
      url: 'URL',
      updatedAt: '更新日',
    },
    download: {
      downloadFailure: '「{nodeName}」のダウンロードに失敗しました。',
    },
  },
})
