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
    uploading: 'Uploading',
    creationNodeFailed: 'Failed to create the {nodeType}.',
    deletionNodeFailed: 'Failed to delete the {nodeType}.',
    moveNodeFailed: 'Failed to move the {nodeType}.',
    renameNodeFailed: 'Failed to rename the {nodeType}.',
    deleteTargetQ: 'Delete "{target}"?',
    deleteNodeQ: 'Delete {nodeNum} {nodeType}?',
    deleteFileAndFolderQ: 'Delete {fileNum} {fileType} and {folderNum} {folderType}?',
    nodeAlreadyExists: 'A {nodeType} called "{nodeName}" already exists.',
    movingNode: 'Move {nodeType}',
    destNotSelected: 'The destination has not been selected.',
    movingNodeAlreadyExistsQ: 'Item "{nodeName}" already exists.\nExisting items will be overwritten. Are you sure?',
    renamingNodeNameIsNotChanged: 'The name has not changed.',
  },
})
