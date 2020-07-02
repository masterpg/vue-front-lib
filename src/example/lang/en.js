import merge from 'lodash/merge'

export default merge(require('@/lib/lang/en').default, {
  common: {},
  error: {},
  sw: {
    ready: 'App is being served from cache by a service worker. For more details, visit https://goo.gl/AFskqB',
    registered: 'Service worker has been registered.',
    cached: 'Content has been cached for offline use.',
    updatefound: 'New content is downloading.',
    updated: 'New content is available.',
    offline: 'No internet connection found. App is running in offline mode.',
    error: 'Error during service worker registration: {error}',
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
    uploading: 'Uploading',
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
      movingNode: 'Move {nodeType}',
      selectDestPrompt: 'Select a destination:',
      destNotSelected: 'The destination has not been selected.',
      alreadyExistsQ: 'Item "{nodeName}" already exists.\nExisting items will be overwritten. Are you sure?',
      movingError: 'An error occurred while moving "{nodeName}".',
    },
    rename: {
      renamingNodeNameIsNotChanged: 'The name has not changed.',
      renamingError: 'An error occurred while renaming "{nodeName}".',
    },
    share: {
      sharingNode: 'Share {nodeType}',
      selectPublicPrompt: 'Choose whether to publish {nodeType}:',
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
      url: 'URL',
      createdAt: 'Created',
      updatedAt: 'Updated',
    },
    download: {
      downloadFailure: 'Failed to download "{nodeName}".',
    },
  },
})
