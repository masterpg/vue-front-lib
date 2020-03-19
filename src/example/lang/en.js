const merge = require('lodash/merge')

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
      deletingError: 'An error occurred while deleting "{nodeName}"',
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
      name: 'Name',
      type: 'Type',
      size: 'Size',
      share: 'Share',
      path: 'Path',
      url: 'URL',
      updated: 'Updated',
    },
  },
})
