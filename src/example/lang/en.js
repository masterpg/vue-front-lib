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
    uploadNode: 'Upload {nodeType}',
    creationNodeFailed: 'Failed to create the {nodeType}.',
    deletionNodeFailed: 'Failed to delete the {nodeType}.',
    renameNodeFailed: 'Failed to rename the {nodeType}.',
    deleteItem: 'Delete Item | Delete Items',
    deleteItemQ: 'Delete "{target}"?',
    deleteFilesQ: 'Delete {fileNum} files?',
    deleteFoldersQ: 'Delete {folderNum} folders?',
    deleteFilesAndFoldersQ: 'Delete {fileNum} and {folderNum} folders?',
    uploading: 'Uploading',
  },
})
