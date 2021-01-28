export default {
  common: {
    ok: 'OK',
    cancel: 'キャンセル',
    create: '作成',
    update: '更新',
    delete: '削除',
    save: '保存',
    entry: '登録',
    discard: '破棄',
    send: '送信',
    failed: '失敗',
    close: '閉じる',
    move: '移動',
    next: '次へ',
    share: '共有',
    rename: '名前変更',
    download: 'ダウンロード',
    reload: 'リロード',
    error: 'エラー',
    systemError: 'システムエラー',
    folder: 'フォルダ',
    file: 'ファイル',
    item: 'アイテム',
    password: 'パスワード',
    email: 'メールアドス',
    displayName: '表示名',
    signUp: 'ユーザー登録',
    signIn: 'サインイン',
    signOut: 'サインアウト',
    draft: '下書き',
    sthName: '{sth}名',
    createSth: '{sth}の作成',
    deleteSth: '{sth}の削除',
    moveSth: '{sth}の移動',
    renameSth: '{sth}の名前変更',
    uploadSth: '{sth}のアップロード',
    shareSth: '{sth}の共有',
  },
  error: {
    required: '「{target}」は必須です。',
    invalid: '「{target}」は不正です。',
    unusable: '「{target}」は使用できません。',
    unexpected: '予期しないエラーが発生しました。',
  },
  index: {
    mainMenu: {
      siteAdmin: 'サイト管理',
      articleAdmin: '記事',
      userStorageAdmin: 'ストレージ',
      appAdmin: 'アプリケーション管理',
      appStorageAdmin: 'ストレージ',
    },
    updated: 'サイトのアップデートが必要です。',
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
      userName: 'ユーザー名',
      fullName: 'フルネーム',
      userNameAlreadyExists: 'このユーザー名は既に存在します。',
    },
    providerList: {
      withGoogle: 'Googleで{type}',
      withFacebook: 'Facebookで{type}',
      withEmail: 'メールアドレスで{type}',
      withAnonymous: 'ゲストで{type}',
    },
  },
  storage: {
    appRootName: 'Storage',
    userRootName: 'Home',
    articleRootName: '記事',
    uploading: 'アップロード中',
    uploadTotalRatio: 'アップロード {0} / {1}',
    uploadFileFailed: 'アップロード失敗',
    uploadFileCanceled: 'キャンセル',
    asset: 'アセット',
    nodeAlreadyExists: '「{nodeName}」という{nodeType}がすでに存在します。',
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
      movingTarget: '移動対象',
      selectDestPrompt: '移動先を選択してください。',
      destNotSelected: '移動先が選択されていません。',
      alreadyExistsQ: '「{nodeName}」というアイテムはすでに存在します。\n既存のアイテムは上書きされますがよろしいですか？',
      movingError: '「{nodeName}」の移動でエラーが発生しました。',
    },
    rename: {
      renamingNodeNameIsNotChanged: '名前が変更されていません。',
      renamingError: '「{nodeName}」の名前変更でエラーが発生しました。',
    },
    share: {
      sharingTarget: '共有対象',
      selectPublicPrompt: '公開タイプ選択してください。',
      notSet: '未設定',
      public: '公開',
      private: '非公開',
      sharingError: '「{nodeName}」の共有でエラーが発生しました。',
    },
    sort: {
      sortingError: '並び順の設定でエラーが発生しました。',
    },
    nodeDetail: {
      id: 'ID',
      name: '名前',
      type: 'タイプ',
      size: 'サイズ',
      share: '共有',
      path: 'パス',
      displayPath: '表示パス',
      url: 'URL',
      createdAt: '作成日',
      updatedAt: '更新日',
    },
    download: {
      downloadFailure: '「{nodeName}」のダウンロードに失敗しました。',
    },
  },
  article: {
    reflectMaster: 'マスターへ反映',
    reflectMasterQ: '下書きをマスターへ反映してもよろしいですか？',
    reflectMasterError: 'マスター反映でエラーが発生しました。',
    saveDraft: '下書き保存',
    saveDraftError: '下書き保存でエラーが発生しました。',
    discardDraft: '下書き破棄',
    discardDraftQ: '下書き破棄してもよろしいですか？',
    discardDraftError: '下書き破棄でエラーが発生しました。',
    nodeType: {
      listBundle: 'リストバンドル',
      treeBundle: 'ツリーバンドル',
      category: 'カテゴリ',
      article: '記事',
    },
  },
}
