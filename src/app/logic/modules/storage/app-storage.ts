import * as _path from 'path'
import {
  APIStorageNode,
  CreateStorageNodeInput,
  RequiredStorageNodeShareSettings,
  SignedUploadUrlInput,
  StorageNode,
  StorageNodeGetKeyInput,
  StorageNodeGetKeysInput,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
} from '@/app/logic'
import { DeepReadonly, arrayToDict, removeBothEndsSlash, splitArrayChunk, splitHierarchicalPaths } from 'web-base-lib'
import { StorageDownloader, StorageFileDownloader } from '@/app/logic/modules/storage/download'
import { StorageFileUploader, StorageUploader } from '@/app/logic/modules/storage/upload'
import { computed, reactive } from '@vue/composition-api'
import { StorageLogic } from '@/app/logic/modules/storage/base'
import { StorageURLUploader } from '@/app/logic/modules/storage/upload-url'
import { StorageUtil } from '@/app/logic/base'
import { extendedMethod } from '@/app/base'
import { injectAPI } from '@/app/logic/api'
import { injectStore } from '@/app/logic/store'

//========================================================================
//
//  Implementation
//
//========================================================================

interface AppStorageLogic extends StorageLogic {
  //--------------------------------------------------
  //  API
  //--------------------------------------------------

  getNodeAPI(input: StorageNodeGetKeyInput): Promise<StorageNode | undefined>
  getNodesAPI(input: StorageNodeGetKeysInput): Promise<StorageNode[]>
  getDirDescendantsAPI(dirPath?: string): Promise<StorageNode[]>
  getDescendantsAPI(dirPath?: string): Promise<StorageNode[]>
  getDirChildrenAPI(dirPath?: string): Promise<StorageNode[]>
  getChildrenAPI(dirPath?: string): Promise<StorageNode[]>
  getHierarchicalNodesAPI(nodePath: string): Promise<StorageNode[]>
  getAncestorDirsAPI(nodePath: string): Promise<StorageNode[]>
  createDirAPI(dirPath: string, input?: CreateStorageNodeInput): Promise<StorageNode>
  createHierarchicalDirsAPI(dirPaths: string[]): Promise<StorageNode[]>
  removeDirAPI(dirPath: string): Promise<void>
  removeFileAPI(filePath: string): Promise<StorageNode | undefined>
  moveDirAPI(fromDirPath: string, toDirPath: string): Promise<void>
  moveFileAPI(fromFilePath: string, toFilePath: string): Promise<StorageNode>
  renameDirAPI(dirPath: string, newName: string): Promise<void>
  renameFileAPI(filePath: string, newName: string): Promise<StorageNode>
  setDirShareSettingsAPI(dirPath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode>
  handleUploadedFileAPI(input: StorageNodeKeyInput): Promise<StorageNode>
  getSignedUploadUrlsAPI(inputs: SignedUploadUrlInput[]): Promise<string[]>
  setFileShareSettingsAPI(filePath: string, input: StorageNodeShareSettingsInput): Promise<StorageNode>

  //--------------------------------------------------
  //  Helper
  //--------------------------------------------------

  apiNodeToStorageNode(apiNode?: APIStorageNode): StorageNode | undefined
  apiNodesToStorageNodes(apiNodes: APIStorageNode[]): StorageNode[]
  /**
   * APIノードをストアに反映します。
   * @param apiNode
   */
  setAPINodeToStore(apiNode: StorageNode): StorageNode
  /**
   * APIノードをストアに反映します。
   * @param apiNodes
   */
  setAPINodesToStore(apiNodes: StorageNode[]): StorageNode[]
  /**
   * APIノードにないストアノードを削除します。
   * @param apiNodes
   * @param storeNodes
   */
  removeNotExistsStoreNodes(apiNodes: APIStorageNode[], storeNodes: DeepReadonly<StorageNode>[]): StorageNode[]
  /**
   * 指定パスを構成するノードに未読み込みのノードがある場合、
   * サーバーから読み込み、ストアに格納します。
   * @param targetPath
   */
  fetchUnloadedHierarchicalNodes(targetPath: string): Promise<void>
  /**
   * 指定ノードを含め階層を構成するディレクトリがストアに存在しているかを走査します。
   * @param targetPath 対象となるノードを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートとその階層を構成するディレクトリが対象となります。
   */
  existsHierarchicalOnStore(targetPath?: string): boolean
  /**
   * 指定ノードを構成する祖先ディレクトリでまだストアに格納されていないものがある場合、
   * サーバーから取得し、ストアに格納します。
   * @param targetPath 対象となるノードを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートを構成する祖先が対象となります。
   */
  fetchUnloadedAncestorDirs(targetPath?: string): Promise<void>
  /**
   * 指定ノードを構成する祖先ディレクトリがストアに存在するかを走査します。
   * @param targetPath 対象となるノードを指定します。
   *   引数が未指定(または空文字)な場合、ベースパスルートを構成する祖先が対象となります。
   */
  existsAncestorDirsOnStore(targetPath?: string): boolean
  /**
   * ノードパスをフルパスに変換します。
   * @param nodePath
   */
  toFullPath(nodePath?: string): string
  /**
   * ノードパスをフルパスに変換します。
   * @param nodePaths
   */
  toFullPaths(nodePaths: string[]): string[]
  /**
   * ノードパスをベースパスを基準に変換します。
   * @param nodePath
   */
  toBasePath(nodePath?: string): string
  /**
   * ノードパスをベースパスを基準に変換します。
   * @param nodePaths
   */
  toBasePaths(nodePaths: string[]): string[]
  /**
   * ノードのパスをベースパスを基準に変換します。
   * ベースパスと指定ノードのパスが同じまたは配下ノードでない場合、`undefined`を返します。
   * @param node
   */
  toBasePathNode<T extends StorageNode | DeepReadonly<StorageNode>>(node?: T): T | undefined
  /**
   * ノードのパスをベースパスを基準に変換します。
   * ベースパスと指定ノードのパスが同じまたは配下ノードでない場合、そのノードは除外されます。
   * @param nodes
   */
  toBasePathNodes<T extends StorageNode | DeepReadonly<StorageNode>>(nodes: T[]): T[]
  /**
   * 引数パスにベースパスルートが設定されていなことを検証します。
   * ※引数パスが未設定または空文字の場合、ベースパスルートと判定されます。
   * @param argName
   * @param nodePath
   */
  validateNotBasePathRoot(argName: string, nodePath?: string): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace AppStorageLogic {
  export function newInstance(): AppStorageLogic {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const api = injectAPI()
    const store = injectStore()

    const state = reactive({
      basePath: '',
    })

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const basePath = computed({
      get: () => state.basePath,
      set: value => (state.basePath = value),
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const getAllNodes: AppStorageLogic['getAllNodes'] = () => {
      const result: StorageNode[] = []
      for (const node of store.storage.all.value) {
        // ベースパスがない場合は無条件にすべてのノードが対象
        // ベースパスがある場合はベースパスルート含め配下のノードが対象
        if (!basePath.value || node.path.startsWith(`${basePath.value}/`)) {
          result.push(StorageNode.clone(toBasePathNode(node)))
        }
      }
      return result
    }

    const getNode: AppStorageLogic['getNode'] = ({ id, path }) => {
      if (typeof path === 'string') {
        path = toFullPath(path)
      }
      return toBasePathNode(store.storage.get({ id, path }))
    }

    const getNodes: AppStorageLogic['getNodes'] = input => {
      const nodes = store.storage.getList(input)
      return toBasePathNodes(nodes)
    }

    const sgetNode: AppStorageLogic['sgetNode'] = key => {
      const id = key.id
      let path = key.path
      if (typeof path === 'string') {
        path = toFullPath(path)
      }
      const node = toBasePathNode(store.storage.get({ id, path }))
      if (!node) {
        throw new Error(`Storage store does not have specified node: ${JSON.stringify(key)}`)
      }
      return node
    }

    const getDirDescendants: AppStorageLogic['getDirDescendants'] = dirPath => {
      const nodes = store.storage.getDirDescendants(toFullPath(dirPath))
      return toBasePathNodes(nodes)
    }

    const getDescendants: AppStorageLogic['getDescendants'] = dirPath => {
      const nodes = store.storage.getDescendants(toFullPath(dirPath))
      return toBasePathNodes(nodes)
    }

    const getDirChildren: AppStorageLogic['getDirChildren'] = dirPath => {
      const nodes = store.storage.getDirChildren(toFullPath(dirPath))
      return toBasePathNodes(nodes)
    }

    const getChildren: AppStorageLogic['getChildren'] = dirPath => {
      const nodes = store.storage.getChildren(toFullPath(dirPath))
      return toBasePathNodes(nodes)
    }

    const getHierarchicalNodes: AppStorageLogic['getHierarchicalNodes'] = nodePath => {
      if (!nodePath) return []
      const nodes = splitHierarchicalPaths(toFullPath(nodePath)).reduce((result, iDirPath) => {
        const iDirNode = store.storage.get({ path: iDirPath })
        iDirNode && result.push(iDirNode)
        return result
      }, [] as StorageNode[])
      return toBasePathNodes(nodes)
    }

    const getInheritedShare: AppStorageLogic['getInheritedShare'] = nodePath => {
      validateNotBasePathRoot('nodePath', nodePath)
      const result: RequiredStorageNodeShareSettings = { isPublic: false, readUIds: [], writeUIds: [] }
      const hierarchicalNodes = getHierarchicalNodes(nodePath)

      for (let i = hierarchicalNodes.length - 1; i >= 0; i--) {
        const node = hierarchicalNodes[i]
        if (typeof node.share.isPublic === 'boolean') {
          result.isPublic = node.share.isPublic
          break
        }
      }

      for (let i = hierarchicalNodes.length - 1; i >= 0; i--) {
        const node = hierarchicalNodes[i]
        if (node.share.readUIds) {
          result.readUIds.push(...node.share.readUIds)
          break
        }
      }

      for (let i = hierarchicalNodes.length - 1; i >= 0; i--) {
        const node = hierarchicalNodes[i]
        if (node.share.writeUIds) {
          result.writeUIds.push(...node.share.writeUIds)
          break
        }
      }

      return result
    }

    const fetchRoot = extendedMethod<AppStorageLogic['fetchRoot']>(async () => {
      // アプリケーションストレージの場合、特にすることはない
    })

    const fetchNode: AppStorageLogic['fetchNode'] = async input => {
      if (!input.id && !removeBothEndsSlash(input.path)) {
        return undefined
      }

      // APIからノードを取得
      const fullInput: StorageNodeGetKeyInput = {}
      input.id && (fullInput.id = input.id)
      input.path && (fullInput.path = toFullPath(input.path))
      const apiNode = await getNodeAPI(fullInput)

      let result: StorageNode | undefined

      // APIからノードが取得された場合
      if (apiNode) {
        // APIノードをストアへ反映
        result = setAPINodeToStore(apiNode)
      }
      // APIからノードが取得されなかった場合
      else {
        // APIから取得されなかったノードをストアから削除
        store.storage.remove(fullInput)
      }

      return toBasePathNode(result)
    }

    const fetchNodes: AppStorageLogic['fetchNodes'] = async input => {
      // APIノードをストアへ反映
      const fullInput: StorageNodeGetKeysInput = {}
      input.ids && (fullInput.ids = input.ids)
      if (input.paths) {
        fullInput.paths = input.paths.filter(path => Boolean(removeBothEndsSlash(path))).map(path => toFullPath(path))
      }
      const apiNodes = await getNodesAPI(fullInput)
      const result = setAPINodesToStore(apiNodes)

      // APIノードにないストアノードを削除
      removeNotExistsStoreNodes(apiNodes, store.storage.getList(fullInput))

      return toBasePathNodes(result)
    }

    const fetchHierarchicalNodes: AppStorageLogic['fetchHierarchicalNodes'] = async nodePath => {
      // APIノードをストアへ反映
      const apiNodes = await getHierarchicalNodesAPI(toFullPath(nodePath))
      const result = setAPINodesToStore(apiNodes)

      // APIノードにないストアノードを削除
      const storeNodes = (() => {
        const result: StorageNode[] = []
        for (const ancestorDirPath of splitHierarchicalPaths(toFullPath(nodePath))) {
          const storeNode = store.storage.get({ path: ancestorDirPath })
          storeNode && result.push(storeNode)
        }
        return result
      })()
      removeNotExistsStoreNodes(apiNodes, storeNodes)

      return toBasePathNodes(result)
    }

    const fetchAncestorDirs: AppStorageLogic['fetchAncestorDirs'] = async nodePath => {
      // APIノードをストアへ反映
      const apiNodes = await getAncestorDirsAPI(toFullPath(nodePath))
      const result = setAPINodesToStore(apiNodes)

      // APIノードにないストアノードを削除
      const storeNodes = (() => {
        const result: StorageNode[] = []
        for (const ancestorDirPath of splitHierarchicalPaths(toFullPath(nodePath))) {
          if (ancestorDirPath === toFullPath(nodePath)) continue
          const storeNode = store.storage.get({ path: ancestorDirPath })
          storeNode && result.push(storeNode)
        }
        return result
      })()
      removeNotExistsStoreNodes(apiNodes, storeNodes)

      return toBasePathNodes(result)
    }

    const fetchDirDescendants: AppStorageLogic['fetchDirDescendants'] = async dirPath => {
      // APIノードをストアへ反映
      const apiNodes = await getDirDescendantsAPI(toFullPath(dirPath))
      const result = setAPINodesToStore(apiNodes)
      // APIノードにないストアノードを削除
      removeNotExistsStoreNodes(apiNodes, store.storage.getDirDescendants(toFullPath(dirPath)))

      return toBasePathNodes(result)
    }

    const fetchDescendants: AppStorageLogic['fetchDescendants'] = async dirPath => {
      // APIノードをストアへ反映
      const apiNodes = await getDescendantsAPI(toFullPath(dirPath))
      const result = setAPINodesToStore(apiNodes)
      // APIノードにないストアノードを削除
      removeNotExistsStoreNodes(apiNodes, store.storage.getDescendants(toFullPath(dirPath)))

      return toBasePathNodes(result)
    }

    const fetchDirChildren: AppStorageLogic['fetchDirChildren'] = async dirPath => {
      // APIノードをストアへ反映
      const apiNodes = await getDirChildrenAPI(toFullPath(dirPath))
      const result = setAPINodesToStore(apiNodes)
      // APIノードにないストアノードを削除
      removeNotExistsStoreNodes(apiNodes, store.storage.getDirChildren(toFullPath(dirPath)))

      return toBasePathNodes(result)
    }

    const fetchChildren: AppStorageLogic['fetchChildren'] = async dirPath => {
      // APIノードをストアへ反映
      const apiNodes = await getChildrenAPI(toFullPath(dirPath))
      const result = setAPINodesToStore(apiNodes)
      // APIノードにないストアノードを削除
      removeNotExistsStoreNodes(apiNodes, store.storage.getChildren(toFullPath(dirPath)))

      return toBasePathNodes(result)
    }

    const fetchHierarchicalDescendants: AppStorageLogic['fetchHierarchicalDescendants'] = async dirPath => {
      const result: StorageNode[] = []

      // 引数ディレクトリが指定されなかった場合
      if (!dirPath) {
        result.push(...(await fetchDirDescendants(dirPath)))
      }
      // 引数ディレクトリが指定された場合
      else {
        result.push(...(await fetchHierarchicalNodes(dirPath)))
        result.push(...(await fetchDescendants(dirPath)))
      }

      return result
    }

    const fetchHierarchicalChildren: AppStorageLogic['fetchHierarchicalChildren'] = async dirPath => {
      const result: StorageNode[] = []

      // 引数ディレクトリが指定されなかった場合
      if (!dirPath) {
        result.push(...(await fetchDirChildren(dirPath)))
      }
      // 引数ディレクトリが指定された場合
      else {
        result.push(...(await fetchHierarchicalNodes(dirPath)))
        result.push(...(await fetchChildren(dirPath)))
      }

      return result
    }

    const createDir = extendedMethod<AppStorageLogic['createDir']>(async (dirPath, input) => {
      validateNotBasePathRoot('dirPath', dirPath)

      // 指定ディレクトリの祖先が読み込まれていない場合、例外をスロー
      // ※祖先が読み込まれていない状態でディレクトリを作成すると、ストアのディレクトリ構造が不整合になるため
      if (!existsAncestorDirsOnStore(dirPath)) {
        throw new Error(`One of the ancestor nodes in the path '${toFullPath(dirPath)}' does not exist.`)
      }

      const apiNode = await createDirAPI(toFullPath(dirPath), input)
      const node = setAPINodeToStore(apiNode)

      return toBasePathNode(node)!
    })

    const createHierarchicalDirs: AppStorageLogic['createHierarchicalDirs'] = async dirPaths => {
      dirPaths.map(dirPath => validateNotBasePathRoot('dirPaths', dirPath))

      const apiNodes = await createHierarchicalDirsAPI(dirPaths.map(dirPath => toFullPath(dirPath)))
      const nodes = setAPINodesToStore(apiNodes)

      return toBasePathNodes(nodes)
    }

    const removeDir: AppStorageLogic['removeDir'] = async dirPath => {
      validateNotBasePathRoot('dirPath', dirPath)

      await removeDirAPI(toFullPath(dirPath))
      store.storage.remove({ path: toFullPath(dirPath) })
    }

    const removeFile: AppStorageLogic['removeFile'] = async filePath => {
      validateNotBasePathRoot('filePath', filePath)

      await removeFileAPI(toFullPath(filePath))
      store.storage.remove({ path: toFullPath(filePath) })
    }

    const moveDir: AppStorageLogic['moveDir'] = async (fromDirPath, toDirPath) => {
      validateNotBasePathRoot('fromDirPath', fromDirPath)
      validateNotBasePathRoot('toDirPath', toDirPath)
      const fullFromDirPath = toFullPath(fromDirPath)
      const fullToDirPath = toFullPath(toDirPath)

      // 移動ノードをストアから取得しておく
      const movingNodes = store.storage.getDirDescendants(fullFromDirPath)

      // ノード移動を実行
      await moveDirAPI(fullFromDirPath, fullToDirPath)
      store.storage.move(fullFromDirPath, fullToDirPath)

      // 移動先の親ディレクトリがストアに存在しない場合、読み込みを行う
      // ※移動ノードの親が存在しないと、移動ノードが迷子になってしまうため、読み込みを行う必要がある
      const fullToParentPath = _path.dirname(fullToDirPath)
      const toParentNode = store.storage.get({ path: fullToParentPath })
      if (!toParentNode) {
        await fetchHierarchicalNodes(toBasePath(fullToParentPath))
      }

      // 移動したノードをサーバーから読み込む
      const apiNodes: StorageNode[] = []
      for (const chunk of splitArrayChunk(movingNodes, 50)) {
        const ids = chunk.map(node => node.id)
        const nodes = await getNodesAPI({ ids })
        apiNodes.push(...nodes)
      }
      const nodes = setAPINodesToStore(apiNodes)

      return toBasePathNodes(nodes)
    }

    const moveFile: AppStorageLogic['moveFile'] = async (fromFilePath, toFilePath) => {
      validateNotBasePathRoot('fromFilePath', fromFilePath)
      validateNotBasePathRoot('toFilePath', toFilePath)

      const apiNode = await moveFileAPI(toFullPath(fromFilePath), toFullPath(toFilePath))
      store.storage.move(toFullPath(fromFilePath), toFullPath(toFilePath))
      const node = setAPINodeToStore(apiNode)

      return toBasePathNode(node)!
    }

    const renameDir = extendedMethod<AppStorageLogic['renameDir']>(async (dirPath, newName) => {
      validateNotBasePathRoot('dirPath', dirPath)
      const fullDirPath = toFullPath(dirPath)

      // リネームノードをストアから取得しておく
      const renamingNodes = store.storage.getDirDescendants(fullDirPath)

      // リネームを実行
      await renameDirAPI(fullDirPath, newName)
      store.storage.rename(fullDirPath, newName)

      // リネームしたノードをサーバーから読み込む
      const apiNodes: StorageNode[] = []
      for (const chunk of splitArrayChunk(renamingNodes, 50)) {
        const ids = chunk.map(node => node.id)
        apiNodes.push(...(await getNodesAPI({ ids })))
      }
      const nodes = setAPINodesToStore(apiNodes)

      return toBasePathNodes(nodes)
    })

    const renameFile = extendedMethod<AppStorageLogic['renameFile']>(async (filePath, newName) => {
      validateNotBasePathRoot('filePath', filePath)

      const apiNode = await renameFileAPI(toFullPath(filePath), newName)
      store.storage.rename(toFullPath(filePath), newName)
      const node = setAPINodeToStore(apiNode)

      return toBasePathNode(node)!
    })

    const setDirShareSettings: AppStorageLogic['setDirShareSettings'] = async (dirPath, input) => {
      validateNotBasePathRoot('dirPath', dirPath)

      const apiNode = await setDirShareSettingsAPI(toFullPath(dirPath), input)
      const node = setAPINodeToStore(apiNode)

      return toBasePathNode(node)!
    }

    const setFileShareSettings: AppStorageLogic['setFileShareSettings'] = async (filePath, input) => {
      validateNotBasePathRoot('filePath', filePath)

      const apiNode = await setFileShareSettingsAPI(toFullPath(filePath), input)
      const node = setAPINodeToStore(apiNode)

      return toBasePathNode(node)!
    }

    const handleUploadedFile: AppStorageLogic['handleUploadedFile'] = async input => {
      const fullInput: StorageNodeKeyInput = {
        id: input.id,
        path: toFullPath(input.path),
      }
      const apiNode = await handleUploadedFileAPI(fullInput)
      const node = setAPINodeToStore(apiNode)

      return toBasePathNode(node)!
    }

    const getSignedUploadUrl: AppStorageLogic['getSignedUploadUrl'] = async input => {
      const fullInput: SignedUploadUrlInput = {
        id: input.id,
        path: toFullPath(input.path),
        contentType: input.contentType,
      }
      const urls = await getSignedUploadUrlsAPI([fullInput])
      return urls[0]
    }

    const newUploader: AppStorageLogic['newUploader'] = owner => {
      return StorageUploader.newInstance(instance, owner)
    }

    const newFileUploader: AppStorageLogic['newFileUploader'] = uploadParam => {
      return StorageFileUploader.newInstance(instance, uploadParam)
    }

    const newUrlUploader: AppStorageLogic['newUrlUploader'] = owner => {
      return StorageURLUploader.newInstance(instance, owner)
    }

    const newDownloader: AppStorageLogic['newDownloader'] = () => {
      return StorageDownloader.newInstance(instance)
    }

    const newFileDownloader: AppStorageLogic['newFileDownloader'] = (type, filePath) => {
      return StorageFileDownloader.newInstance(instance, type, filePath)
    }

    //--------------------------------------------------
    //  API
    //--------------------------------------------------

    const getNodeAPI = extendedMethod<AppStorageLogic['getNodeAPI']>(async input => {
      const apiNode = await api.getStorageNode(input)
      return apiNodeToStorageNode(apiNode)
    })

    const getNodesAPI = extendedMethod<AppStorageLogic['getNodesAPI']>(async input => {
      const apiNodes = await api.getStorageNodes(input)
      return apiNodesToStorageNodes(apiNodes)
    })

    const getDirDescendantsAPI = extendedMethod<AppStorageLogic['getDirDescendantsAPI']>(async dirPath => {
      const apiNodes = await api.callStoragePaginationAPI(api.getStorageDirDescendants, dirPath)
      return apiNodesToStorageNodes(apiNodes)
    })

    const getDescendantsAPI = extendedMethod<AppStorageLogic['getDescendantsAPI']>(async dirPath => {
      const apiNodes = await api.callStoragePaginationAPI(api.getStorageDescendants, dirPath)
      return apiNodesToStorageNodes(apiNodes)
    })

    const getDirChildrenAPI = extendedMethod<AppStorageLogic['getDirChildrenAPI']>(async dirPath => {
      const apiNodes = await api.callStoragePaginationAPI(api.getStorageDirChildren, dirPath)
      return apiNodesToStorageNodes(apiNodes)
    })

    const getChildrenAPI = extendedMethod<AppStorageLogic['getChildrenAPI']>(async dirPath => {
      const apiNodes = await api.callStoragePaginationAPI(api.getStorageChildren, dirPath)
      return apiNodesToStorageNodes(apiNodes)
    })

    const getHierarchicalNodesAPI = extendedMethod<AppStorageLogic['getHierarchicalNodesAPI']>(async nodePath => {
      const apiNodes = await api.getStorageHierarchicalNodes(nodePath)
      return apiNodesToStorageNodes(apiNodes)
    })

    const getAncestorDirsAPI = extendedMethod<AppStorageLogic['getAncestorDirsAPI']>(async nodePath => {
      const apiNodes = await api.getStorageAncestorDirs(nodePath)
      return apiNodesToStorageNodes(apiNodes)
    })

    const createDirAPI = extendedMethod<AppStorageLogic['createDirAPI']>(async (dirPath, input) => {
      const apiNode = await api.createStorageDir(dirPath, input)
      return apiNodeToStorageNode(apiNode)!
    })

    const createHierarchicalDirsAPI = extendedMethod<AppStorageLogic['createHierarchicalDirsAPI']>(async dirPaths => {
      const apiNodes = await api.createStorageHierarchicalDirs(dirPaths)
      return apiNodesToStorageNodes(apiNodes)
    })

    const removeDirAPI = extendedMethod<AppStorageLogic['removeDirAPI']>(async dirPath => {
      await api.removeStorageDir(dirPath)
    })

    const removeFileAPI = extendedMethod<AppStorageLogic['removeFileAPI']>(async filePath => {
      const apiNode = await api.removeStorageFile(filePath)
      return apiNodeToStorageNode(apiNode)
    })

    const moveDirAPI = extendedMethod<AppStorageLogic['moveDirAPI']>(async (fromDirPath, toDirPath) => {
      await api.moveStorageDir(fromDirPath, toDirPath)
    })

    const moveFileAPI = extendedMethod<AppStorageLogic['moveFileAPI']>(async (fromFilePath, toFilePath) => {
      const apiNode = await api.moveStorageFile(fromFilePath, toFilePath)
      return apiNodeToStorageNode(apiNode)!
    })

    const renameDirAPI = extendedMethod<AppStorageLogic['renameDirAPI']>(async (dirPath, newName) => {
      await api.renameStorageDir(dirPath, newName)
    })

    const renameFileAPI = extendedMethod<AppStorageLogic['renameFileAPI']>(async (filePath, newName) => {
      const apiNode = await api.renameStorageFile(filePath, newName)
      return apiNodeToStorageNode(apiNode)!
    })

    const setDirShareSettingsAPI = extendedMethod<AppStorageLogic['setDirShareSettingsAPI']>(async (dirPath, input) => {
      const apiNode = await api.setStorageDirShareSettings(dirPath, input)
      return apiNodeToStorageNode(apiNode)!
    })

    const handleUploadedFileAPI = extendedMethod<AppStorageLogic['handleUploadedFileAPI']>(async input => {
      const apiNode = await api.handleUploadedFile(input)
      return apiNodeToStorageNode(apiNode)!
    })

    const getSignedUploadUrlsAPI = extendedMethod<AppStorageLogic['getSignedUploadUrlsAPI']>(async inputs => {
      return await api.getSignedUploadUrls(inputs)
    })

    const setFileShareSettingsAPI = extendedMethod<AppStorageLogic['setFileShareSettingsAPI']>(async (filePath, input) => {
      const apiNode = await api.setStorageFileShareSettings(filePath, input)
      return apiNodeToStorageNode(apiNode)!
    })

    //--------------------------------------------------
    //  Helper
    //--------------------------------------------------

    const apiNodeToStorageNode: AppStorageLogic['apiNodeToStorageNode'] = apiNode => {
      if (!apiNode) return undefined
      return apiNodesToStorageNodes([apiNode])[0]
    }

    const apiNodesToStorageNodes: AppStorageLogic['apiNodesToStorageNodes'] = apiNodes => {
      return apiNodes.map(apiNode => {
        return { ...apiNode, url: StorageUtil.getNodeURL(apiNode.id) }
      })
    }

    const setAPINodeToStore: AppStorageLogic['setAPINodeToStore'] = apiNode => {
      return setAPINodesToStore([apiNode])[0]
    }

    const setAPINodesToStore: AppStorageLogic['setAPINodesToStore'] = apiNodes => {
      const result: StorageNode[] = []

      for (const apiNode of apiNodes) {
        const storeNode = store.storage.get({ id: apiNode.id, path: apiNode.path })
        if (!storeNode) {
          result.push(store.storage.add(apiNode))
        } else {
          // ストアノードとAPIノードのパスが異なる場合
          // ※ノード移動が行われていた場合
          if (storeNode.path !== apiNode.path) {
            store.storage.move(storeNode.path, apiNode.path)
          }
          result.push(store.storage.set(apiNode))
        }
      }

      store.storage.sort()

      return result
    }

    const removeNotExistsStoreNodes: AppStorageLogic['removeNotExistsStoreNodes'] = (apiNodes, storeNodes) => {
      const apiNodeIdDict = arrayToDict(apiNodes, 'id')
      const apiNodePathDict = arrayToDict(apiNodes, 'path')

      const removingNodes: string[] = []
      for (const storeNode of storeNodes) {
        const exists = Boolean(apiNodeIdDict[storeNode.id] || apiNodePathDict[storeNode.path])
        !exists && removingNodes.push(storeNode.path)
      }

      return store.storage.removeList({ paths: removingNodes })
    }

    const fetchUnloadedHierarchicalNodes: AppStorageLogic['fetchUnloadedHierarchicalNodes'] = async targetPath => {
      // 対象ノードの祖先がストアに存在しない場合
      if (!existsHierarchicalOnStore(targetPath)) {
        // 対象ノードを構成するノードをサーバーから読み込み
        await fetchHierarchicalNodes(targetPath)
      }
    }

    const existsHierarchicalOnStore: AppStorageLogic['existsHierarchicalOnStore'] = targetPath => {
      const nodePaths = splitHierarchicalPaths(toFullPath(targetPath))
      for (const nodePath of nodePaths) {
        const node = store.storage.get({ path: nodePath })
        if (!node) return false
      }
      return true
    }

    const fetchUnloadedAncestorDirs: AppStorageLogic['fetchUnloadedAncestorDirs'] = async targetPath => {
      // 対象ノードの祖先がストアに存在しない場合
      if (!existsAncestorDirsOnStore(targetPath)) {
        // 対象ノードの祖先をサーバーから読み込み
        await fetchAncestorDirs(targetPath)
      }
    }

    const existsAncestorDirsOnStore: AppStorageLogic['existsAncestorDirsOnStore'] = targetPath => {
      const nodePaths = splitHierarchicalPaths(toFullPath(targetPath)).filter(dirPath => dirPath !== toFullPath(targetPath))
      for (const nodePath of nodePaths) {
        const node = store.storage.get({ path: nodePath })
        if (!node) return false
      }
      return true
    }

    const toFullPath: AppStorageLogic['toFullPath'] = nodePath => {
      return StorageUtil.toFullPath(basePath.value, nodePath)
    }

    const toFullPaths: AppStorageLogic['toFullPaths'] = nodePaths => {
      return StorageUtil.toFullPaths(basePath.value, nodePaths)
    }

    const toBasePath: AppStorageLogic['toBasePath'] = nodePath => {
      return StorageUtil.toBasePath(basePath.value, nodePath)
    }

    const toBasePaths: AppStorageLogic['toBasePaths'] = nodePaths => {
      return StorageUtil.toBasePaths(basePath.value, nodePaths)
    }

    const toBasePathNode: AppStorageLogic['toBasePathNode'] = node => {
      return StorageUtil.toBasePathNode(basePath.value, node)
    }

    const toBasePathNodes: AppStorageLogic['toBasePathNodes'] = nodes => {
      return StorageUtil.toBasePathNodes(basePath.value, nodes)
    }

    const validateNotBasePathRoot: AppStorageLogic['validateNotBasePathRoot'] = (argName, nodePath) => {
      if (!nodePath) {
        throw new Error(`Base path root is set for '${argName}'.`)
      }
    }

    /**
     * 引数パスにバケットルートが設定されていなことを検証します。
     * ※引数パスをベースパスルートに変換した際、そのパスが空文字の場合バケットルートと判定されます。
     * @param argName
     * @param nodePath
     */
    function validateNotBucketRoot(argName: string, nodePath?: string): void {
      if (!toFullPath(nodePath)) {
        throw new Error(`Bucket root is set for '${argName}'.`)
      }
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    const instance = {
      //--------------------------------------------------
      //  StorageLogic
      //--------------------------------------------------
      basePath,
      getAllNodes,
      getNode,
      getNodes,
      sgetNode,
      getDirDescendants,
      getDescendants,
      getDirChildren,
      getChildren,
      getHierarchicalNodes,
      getInheritedShare,
      fetchRoot,
      fetchNode,
      fetchNodes,
      fetchHierarchicalNodes,
      fetchAncestorDirs,
      fetchDirDescendants,
      fetchDescendants,
      fetchDirChildren,
      fetchChildren,
      fetchHierarchicalDescendants,
      fetchHierarchicalChildren,
      createDir,
      createHierarchicalDirs,
      removeDir,
      removeFile,
      moveDir,
      moveFile,
      renameDir,
      renameFile,
      setDirShareSettings,
      setFileShareSettings,
      handleUploadedFile,
      getSignedUploadUrl,
      newUploader,
      newFileUploader,
      newDownloader,
      newUrlUploader,
      newFileDownloader,
      //--------------------------------------------------
      //  AppStorageLogic
      //--------------------------------------------------
      getNodeAPI,
      getNodesAPI,
      getDirDescendantsAPI,
      getDescendantsAPI,
      getDirChildrenAPI,
      getChildrenAPI,
      getHierarchicalNodesAPI,
      getAncestorDirsAPI,
      createDirAPI,
      createHierarchicalDirsAPI,
      removeDirAPI,
      removeFileAPI,
      moveDirAPI,
      moveFileAPI,
      renameDirAPI,
      renameFileAPI,
      setDirShareSettingsAPI,
      handleUploadedFileAPI,
      getSignedUploadUrlsAPI,
      setFileShareSettingsAPI,
      apiNodeToStorageNode,
      apiNodesToStorageNodes,
      setAPINodeToStore,
      setAPINodesToStore,
      removeNotExistsStoreNodes,
      fetchUnloadedHierarchicalNodes,
      existsHierarchicalOnStore,
      fetchUnloadedAncestorDirs,
      existsAncestorDirsOnStore,
      toFullPath,
      toFullPaths,
      toBasePath,
      toBasePaths,
      toBasePathNode,
      toBasePathNodes,
      validateNotBasePathRoot,
    }

    return instance
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppStorageLogic }
