const merge = require('lodash/merge')

export default merge(require('@/lib/lang/en').default, {
  common: {
    create: 'Create',
    cancel: 'Cancel',
    delete: 'Delete',
    failed: 'Failed',
  },
  error: {
    unexpected: 'An unexpected error has occurred.',
  },
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
    createFolder: 'Create folder',
    uploadFiles: 'Upload files',
    uploadFolder: 'Upload folder',
    folderName: 'Folder name',
    folderNameIsRequired: 'Folder name is a required.',
    slashIsUnusable: '"/" cannot be used.',
    creationFolderFailed: 'Creation of the folder failed.',
    deletionItemsFailed: 'Deletion of the items failed.',
    deleteItems: 'Delete items',
    deleteItemQ: 'Delete "{name}"?',
    deleteFilesQ: 'Delete {fileNum} files?',
    deleteFoldersQ: 'Delete {folderNum} folders?',
    deleteFilesAndFoldersQ: 'Delete {fileNum} and {folderNum} folders?',
    uploading: 'Uploading',
  },
})
