export default {
  common: {
    ok: 'OK',
    cancel: 'Cancel',
    create: 'Create',
    update: 'Update',
    delete: 'Delete',
    entry: 'Entry',
    send: 'Send',
    failed: 'Failed',
    close: 'Close',
    move: 'Move',
    next: 'Next',
    share: 'Share',
    rename: 'Rename',
    download: 'Download',
    reload: 'Reload',
    error: 'Error | Errors',
    systemError: 'System Error',
    folder: 'Folder | Folders',
    file: 'File | Files',
    item: 'Item | Items',
    password: 'Password',
    email: 'E-mail',
    displayName: 'Display Name',
    signUn: 'Sign up',
    signIn: 'Sign in',
    signOut: 'Sign out',
    sthName: '{sth} Name',
    createSth: 'Create {sth}',
    deleteSth: 'Delete {sth}',
    moveSth: 'Move {sth}',
    renameSth: 'Rename {sth}',
    uploadSth: 'Upload {sth}',
    shareSth: 'Share {sth}',
  },
  error: {
    required: '"{target}" is a required.',
    invalid: '"{target}" is a invali.',
    unusable: '"{target}" cannot be used.',
    unexpected: 'An unexpected error has occurred.',
  },
  index: {
    mainMenu: {
      siteAdmin: 'Site Admin',
      articleAdmin: '記事',
      userStorageAdmin: 'Storage',
      appStorageAdmin: 'App Storage',
    },
    updated: 'The site needs to be updated.',
  },
  serviceWorker: {
    ready: 'ServiceWorker was launched from the cache.',
    installing: 'ServiceWorker is installing.',
    updating: 'ServiceWorker is updating.',
    installed: 'ServiceWorker has been installed.',
    updated: 'ServiceWorker has been updated.',
    active: 'ServiceWorker is now active. You can now operate ServiceWorker.',
    offline: 'ServiceWorker is running in offline mode because it cannot connect to the server.',
    error: 'An error occurred during ServiceWorker registration.',
  },
  auth: {
    signInFailed: 'Sign in failed.',
    signUpFailed: 'User creation failed.',
    authFailedCode: {
      wrongPassword: 'The password is invalid or your email address does not exist.',
      userNotFound: 'The password is invalid or your email address does not exist.',
      tooManyRequests: 'Too many unsuccessful login attempts. Please try again later.',
      emailAlreadyInUse: 'The email address is already in use by another account.',
    },
    emailVerifying: 'Verifying Email',
    emailVerifyingMsg: '"{email}" has been sent out to verify. Please check your email and follow the instructions.',
    emailUnverifiedMsg: `"{email}" hasn't been verified yet.`,
    forgotPassword: 'Forgot your password?',
    resetPassword: 'Rest password',
    restPasswordSendMsg: `We'll send you an email to reset your password.`,
    restPasswordSentMsg: 'We sent an email to "{email}". Please follow the instructions to reset your password.',
    deleteUser: 'Delete user',
    deleteUserMsg: 'Deleted user can not be recovered. Are you sure you want to delete your user?',
    deleteUserSignInMsg: `You need to sign in because you haven't been signed in for a period of time.`,
    changeEmail: 'Change email',
    entry: {
      userInfo: 'User information',
      fullName: 'Full name',
    },
    providerList: {
      withGoogle: '{type} with Google',
      withFacebook: '{type} with Facebook',
      withEmail: '{type} with Email',
      withAnonymous: '{type} as guest',
    },
  },
  storage: {
    userRootName: 'Home',
    appRootName: 'Storage',
    articleRootName: 'Article',
    uploading: 'Uploading',
    uploadTotalRatio: 'Upload {0} / {1}',
    uploadFileFailed: 'Upload failed.',
    uploadFileCanceled: 'Upload canceled.',
    asset: 'Asset | Assets',
    nodeAlreadyExists: 'A {nodeType} called "{nodeName}" already exists.',
    create: {
      creatingDirError: 'An error occurred while creating "{nodeName}"',
    },
    delete: {
      deleteTargetQ: 'Delete "{target}"?',
      deleteNodeQ: 'Delete {nodeNum} {nodeType}?',
      deleteFileAndFolderQ: 'Delete {fileNum} {fileType} and {folderNum} {folderType}?',
      deletingError: 'An error occurred while deleting "{nodeName}".',
    },
    move: {
      movingTarget: 'Moving target',
      selectDestPrompt: 'Select a destination.',
      destNotSelected: 'The destination has not been selected.',
      alreadyExistsQ: 'Item "{nodeName}" already exists.\nExisting items will be overwritten. Are you sure?',
      movingError: 'An error occurred while moving "{nodeName}".',
    },
    rename: {
      renamingNodeNameIsNotChanged: 'The name has not changed.',
      renamingError: 'An error occurred while renaming "{nodeName}".',
    },
    share: {
      sharingTarget: 'Sharing target',
      selectPublicPrompt: 'Select a publication type.',
      notSet: 'Not set',
      public: 'Public',
      private: 'Private',
      sharingError: 'An error occurred while sharing "{nodeName}".',
    },
    nodeDetail: {
      id: 'ID',
      name: 'Name',
      type: 'Type',
      size: 'Size',
      share: 'Share',
      path: 'Path',
      displayPath: 'Display Path',
      url: 'URL',
      createdAt: 'Created',
      updatedAt: 'Updated',
    },
    download: {
      downloadFailure: 'Failed to download "{nodeName}".',
    },
  },
  article: {
    nodeType: {
      listBundle: 'List Type Bundle' | 'List Type Bundles',
      categoryBundle: 'Category Bundle' | 'Category Bundles',
      category: 'Category' | 'Categories',
      article: 'Article' | 'Articles',
    },
  },
}
