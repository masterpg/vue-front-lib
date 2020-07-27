<style lang="sass" scoped></style>

<template>
  <comp-tree-view ref="treeView" @select="m_onSelect" @lazy-load="m_onLazyLoad" @context-menu-select="m_onContextMenuSelect" />
</template>

<script lang="ts">
import * as _path from 'path'
import {
  BaseComponent,
  CompTreeView,
  CompTreeViewEvent,
  CompTreeViewLazyLoadEvent,
  NoCache,
  Resizable,
  StorageLogic,
  StorageNode,
  StorageNodeShareSettings,
  StorageNodeType,
  UploadEndedEvent,
} from '@/lib'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { StorageNodeContextMenuSelectedEvent, StorageTreeNode, StorageTreeNodeInput, StorageTypeMixin, nodeToTreeData } from './base'
import { arrayToDict, removeBothEndsSlash, removeStartDirChars, splitHierarchicalPaths } from 'web-base-lib'
import { mixins } from 'vue-class-component'

@Component({
  components: { CompTreeView },
})
export default class StorageTreeView extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.pageStore.isPageActive = true
  }

  mounted() {
    this.m_treeView.addNode(this.rootNode)
  }

  destroyed() {
    this.pageStore.isPageActive = false
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  nodeFilter!: (node: StorageNode) => boolean

  /**
   * ツリービューのルートノードです。
   */
  get rootNode(): StorageTreeNode {
    return this.pageStore.rootNode
  }

  /**
   * ツリービューの選択ノードです。
   */
  get selectedNode(): StorageTreeNode {
    return this.m_treeView.selectedNode ? this.m_treeView.selectedNode : this.rootNode
  }

  set selectedNode(node: StorageTreeNode) {
    const current = this.m_treeView.selectedNode
    if (current) {
      if (current.path !== node.path) {
        this.m_treeView.selectedNode = node
      }
    } else {
      this.m_treeView.selectedNode = node
    }
  }

  /**
   * 指定されたノードの選択状態を設定します。
   * @param value ノードを特定するための値を指定
   * @param selected 選択状態を指定
   * @param silent 選択イベントを発火したくない場合はtrueを指定
   */
  setSelectedNode(value: string, selected: boolean, silent: boolean): void {
    this.m_treeView.setSelectedNode(value, selected, silent)
  }

  /**
   * ストレージノードの初期読み込みが行われたかを示すフラグです。
   */
  get isInitialPull(): boolean {
    return this.pageStore.isInitialPull
  }

  @Watch('isInitialPull')
  private m_isInitialReaOnChange(newValue: string, oldValue: string): void {
    console.log(`m_isInitialReaOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  // NOTE: 単体テスト用にpublic
  @NoCache
  get m_treeView(): CompTreeView<StorageTreeNode> {
    return this.$refs.treeView as CompTreeView<StorageTreeNode>
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * サーバーから初期ストレージの読み込みを行います。
   * @param dirPath
   */
  async pullInitialNodes(dirPath?: string): Promise<void> {
    if (this.pageStore.isInitialPull) return

    dirPath = removeBothEndsSlash(dirPath)

    // ルートノードを遅延ロード中に設定
    this.rootNode.open(false)
    this.rootNode.lazy = true
    this.rootNode.lazyLoadStatus = 'loading'

    // 引数ディレクトリを含め、階層構造を形成するディレクトリをサーバーから取得
    await this.storageLogic.fetchHierarchicalNodes(dirPath)

    // 引数ディレクトリ配下にある各ディレクトリの子ノードをサーバーから取得
    const dirPaths = splitHierarchicalPaths(dirPath)
    for (const iDirPath of [this.rootNode.path, ...dirPaths]) {
      await this.storageLogic.fetchChildren(iDirPath)
    }

    // サーバーから取得された最新のストレージノードを取得
    const dirNodes = this.storageLogic.nodes.filter(this.nodeFilter)
    const dirNodeDict = arrayToDict(dirNodes, 'path')

    // 引数ディレクトリのパスを構成するディレクトリは展開した状態にする
    // ※初期表示時は指定されたディレクトリを表示しておきたいので
    for (const dirPath of dirPaths) {
      const dirNode = dirNodeDict[dirPath]
      if (dirNode) {
        ;(dirNode as StorageTreeNodeInput).opened = true
      }
    }

    // 最新のストレージノードをツリービューに設定
    this.setAllNodes(Object.values(dirNodeDict))

    // 引数ディレクトリのパスを構成する各ディレクトリは子ノードが取得済みなので、
    // 各ディレクトリの遅延ロードは済みにする
    for (const dirPath of dirPaths) {
      const dirTreeNode = this.getNode(dirPath)
      if (dirTreeNode) {
        dirTreeNode.lazyLoadStatus = 'loaded'
      }
    }

    // ルートノードを遅延ロード済みに設定
    this.rootNode.lazyLoadStatus = 'loaded'

    this.pageStore.isInitialPull = true
  }

  /**
   * 指定されたディレクトリ直下の子ノードをサーバーから取得します。
   * @param dirPath
   */
  async pullChildren(dirPath: string): Promise<void> {
    const storeChildDirNodes = (await this.storageLogic.fetchChildren(dirPath)).filter(this.nodeFilter)

    // ロジックストアのノードをツリービューに反映
    this.setNodes(storeChildDirNodes)

    const dirTreeNode = this.getNode(dirPath)
    if (!dirTreeNode) {
      throw new Error(`The specified node was not found: '${dirPath}'`)
    }

    // ロジックストアにないがツリーには存在するノードをツリーから削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    this.m_removeNotExistsTreeNodes(storeChildDirNodes, dirTreeNode.children)

    // 引数ディレクトリを遅延ロード済みに設定
    dirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * 指定されたディレクトリの再読み込みを行います。
   * @param dirPath
   */
  async reloadDir(dirPath: string): Promise<void> {
    dirPath = removeBothEndsSlash(dirPath)

    // 引数ディレクトリを遅延ロード中に設定
    const dirTreeNode = this.getNode(dirPath)!
    dirTreeNode.lazyLoadStatus = 'loading'

    // 引数ディレクトリのパスを構成する各ディレクトリと配下ノードをサーバーから取得
    await this.storageLogic.fetchHierarchicalDescendants(dirPath)

    // ロジックストアのノードをツリービューに反映
    // ※引数ディレクトリの祖先ディレクトリが対象
    splitHierarchicalPaths(dirPath).map(ancestorDirPath => {
      // 引数ディレクトリは以降で処理するためここでは無視
      if (ancestorDirPath === dirPath) return
      // 祖先ディレクトリをツリービューに反映
      const storeDirNode = this.storageLogic.getNode({ path: ancestorDirPath })
      if (storeDirNode) {
        this.setNode(storeDirNode)
      } else {
        this.removeNode(ancestorDirPath)
      }
    })

    // ロジックストアのノードをツリービューに反映
    // ※引数ディレクトリと配下ノードが対象
    this.mergeDirDescendants(dirPath)

    // 引数ディレクトリ配下にあるディレクトリの遅延ロード状態を済みに設定
    let treeDescendants: StorageTreeNode[] = []
    if (dirPath === this.rootNode.path) {
      treeDescendants = this.getAllNodes()
    } else {
      const dirTreeNode = this.m_treeView.getNode(dirPath)
      if (dirTreeNode) {
        treeDescendants = dirTreeNode.getDescendants()
      }
    }
    for (const treeNode of treeDescendants) {
      if (treeNode.nodeType === StorageNodeType.Dir) {
        treeNode.lazyLoadStatus = 'loaded'
      }
    }

    // 選択ノードがなくなってしまった場合
    if (!this.selectedNode) {
      this.selectedNode = this.rootNode
    }

    // 引数ディレクトリを遅延ロード済みに設定
    dirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * アップロードが行われた後のツリーの更新処理を行います。
   * @param e
   */
  async onUploaded(e: UploadEndedEvent): Promise<void> {
    const uploadDirTreeNode = this.getNode(e.uploadDirPath)
    if (!uploadDirTreeNode) {
      throw new Error(`The specified node could not be found: '${e.uploadDirPath}'`)
    }

    // アップロードディレクトリ直下のアップロードノードを取得
    // 引数イベントが次のような場合:
    //   e: {
    //     uploadDirPath: 'd1',
    //     uploadFiles: [
    //       { path: 'd1/d11/d111/fileA.txt', … },
    //       { path: 'd1/d11/fileB.txt', … },
    //       { path: 'd1/d12/fileC.txt', … },
    //       { path: 'd1/fileD.txt', … },
    //     ]
    //   }
    // 次のようなパスが取得される:
    //   ['d1/d11', 'd1/d12', 'd1/fileD.txt']
    const childNodePaths = e.uploadedFiles.reduce<string[]>((result, item) => {
      const childNodePath = (() => {
        const uploadDirPath = e.uploadDirPath ? _path.join(e.uploadDirPath, '/') : ''
        const workPath = item.path.replace(uploadDirPath, '')
        const childNodeName = workPath.split('/')[0]
        return _path.join(e.uploadDirPath, childNodeName)
      })()
      if (!result.includes(childNodePath)) {
        result.push(childNodePath)
      }
      return result
    }, [])

    // ロジックストア(サーバー)からアップロードディレクトリ直下のノードを取得
    const storeChildDirNodes = (await this.storageLogic.fetchChildren(e.uploadDirPath)).filter(this.nodeFilter)

    // ロジックストアのノードで、アップロードされたノードをツリービューに反映
    for (const storeDirNode of storeChildDirNodes) {
      const treeNode = this.getNode(storeDirNode.path)
      // 次の場合リロードが必要
      // ・今回アップロードされたノードがツリービューに既に存在
      // ・そのディレクトリが子ノードを読み込み済み
      // ・そのディレクトリがアップロード先ディレクトリの直下に存在する
      const needReload = treeNode && treeNode.lazyLoadStatus === 'loaded' && childNodePaths.includes(treeNode.path)
      // リロードが必要な場合
      if (needReload) {
        await this.reloadDir(treeNode!.path)
      }
      // リロードが必要ない場合
      else {
        this.setNode(storeDirNode)
      }
    }

    // 引数ディレクトリを遅延ロード済みに設定
    uploadDirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * ツリービューの全てのツリーノードを取得します。
   */
  getAllNodes(): StorageTreeNode[] {
    return this.m_treeView.getAllNodes()
  }

  /**
   * 指定されたパスと一致するツリーノードを取得します。
   * @param path
   */
  getNode(path: string): StorageTreeNode | undefined {
    return this.m_treeView.getNode(path)
  }

  /**
   * ツリービューにあるノードを全て削除し、指定されたノードに置き換えます。
   * @param nodes
   */
  setAllNodes(nodess: StorageTreeNodeInput[]): void {
    const targetNodePaths = this.getAllNodes().reduce((result, node) => {
      node !== this.rootNode && result.push(node.path)
      return result
    }, [] as string[])
    this.removeNodes(targetNodePaths)

    this.setNodes(nodess)
  }

  /**
   * ツリービューのノードと指定されたノードをマージしてツリービューに反映します。
   * @param nodes
   */
  mergeAllNodes(nodes: StorageTreeNodeInput[]): void {
    let filteredNodes = nodes.filter(this.nodeFilter)
    filteredNodes = StorageLogic.sortNodes([...filteredNodes])

    const nodeDict = arrayToDict(filteredNodes, 'path')

    // 新ノードリストにないのにツリーには存在するノードを削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    for (const treeNode of this.getAllNodes()) {
      // ツリーのルートノードは新ノードリストには存在しないので無視
      if (treeNode === this.rootNode) continue

      const node = nodeDict[treeNode.path]
      !node && this.removeNode(treeNode.path)
    }

    // 新ノードリストをツリービューへ反映
    for (const newDirNode of Object.values(nodeDict)) {
      this.setNode(newDirNode)
    }
  }

  /**
   * 指定されたノード＋配下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeDirDescendants(dirPath: string): void {
    // ロジックストアから引数ディレクトリと配下のノードを取得
    const storeDirDescendants = this.storageLogic.getDirDescendants(dirPath).filter(this.nodeFilter)
    const storeDirDescendantIdDict = arrayToDict(storeDirDescendants, 'id')
    const storeDirDescendantPathDict = arrayToDict(storeDirDescendants, 'path')

    // ロジックストアのノードリストをツリービューへ反映
    this.setNodes(storeDirDescendants)

    // ツリービューから引数ディレクトリと配下のノードを取得
    const dirTreeNode = this.getNode(dirPath)
    const driTreeDescendants: StorageTreeNode[] = []
    if (dirTreeNode) {
      driTreeDescendants.push(dirTreeNode)
      driTreeDescendants.push(...dirTreeNode.getDescendants())
    }

    // ロジックストアのノードリストにないのにツリーには存在するノードを削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    for (const treeNode of driTreeDescendants) {
      // ツリーのルートノードはロジックストアには存在しないので無視
      if (treeNode === this.rootNode) continue

      const exists = Boolean(storeDirDescendantIdDict[treeNode.id] || storeDirDescendantPathDict[treeNode.path])
      !exists && this.removeNode(treeNode.path)
    }
  }

  /**
   * ツリービューのノードと指定されたノード＋直下ノードをロジックストアから取得し、ツリービューにマージします。
   * @param dirPath
   */
  mergeDirChildren(dirPath: string): void {
    // ロジックストアから引数ディレクトリと直下のノードを取得
    const storeDirChildren = this.storageLogic.getDirChildren(dirPath).filter(this.nodeFilter)
    const storeDirChildrenIdDict = arrayToDict(storeDirChildren, 'id')
    const storeDirChildrenPathDict = arrayToDict(storeDirChildren, 'path')

    // ロジックストアのノードリストをツリービューへ反映
    this.setNodes(storeDirChildren)

    // ツリービューから引数ディレクトリと直下のノードを取得
    const dirTreeNode = this.getNode(dirPath)
    const dirTreeChildren: StorageTreeNode[] = []
    if (dirTreeNode) {
      dirTreeChildren.push(dirTreeNode)
      dirTreeChildren.push(...dirTreeNode.children)
    }

    // ロジックストアのノードリストにないのにツリーには存在するノードを削除
    // ※他の端末で削除、移動、リネームされたノードが削除される
    for (const treeNode of dirTreeChildren) {
      // ツリーのルートノードはロジックストアには存在しないので無視
      if (treeNode === this.rootNode) continue

      const exists = Boolean(storeDirChildrenIdDict[treeNode.id] || storeDirChildrenPathDict[treeNode.path])
      !exists && this.removeNode(treeNode.path)
    }
  }

  /**
   * 指定されたノードリストをツリービューに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param nodes
   */
  setNodes(nodes: StorageTreeNodeInput[]): void {
    nodes = StorageLogic.sortNodes([...nodes])

    for (const node of nodes) {
      this.setNode(node)
    }
  }

  /**
   * 指定されたノードをツリービューに設定します。
   * 対象のツリーノードがなかった場合、指定されたノードをもとにツリーノードを作成します。
   * @param node
   */
  setNode(node: StorageTreeNodeInput): void {
    // id検索が必要な理由:
    //   他端末でノード移動するとidは変わらないがpathは変化する。
    //   この状況でpath検索を行うと、対象のノードを見つけられないためid検索する必要がある。
    // path検索が必要な理由:
    //   他端末で'd1/d11'を削除してからまた同じパスの'd1/d11'が作成された場合、
    //   元のidと再作成されたidが異なり、パスは同じでもidが異なる状況が発生する。
    //   この場合id検索しても対象ノードが見つからないため、path検索する必要がある。
    let treeNode = this.m_getNodeById(node.id) || this.getNode(node.path)

    // ツリービューに引数ノードが既に存在する場合
    if (treeNode) {
      // パスに変更がある場合(移動またはリネームされていた場合)
      if (treeNode.path !== node.path) {
        this.moveNode(treeNode.path, node.path)
        // `moveNode()`によって`treeNode`が削除されるケースがあるので取得し直している
        // ※移動先に同名ノードがあると、移動ノードが移動先ノードを上書きし、その後移動ノードは削除される。
        //   これにより`treeNode`はツリービューには存在しないノードとなるため取得し直す必要がある。
        treeNode = this.getNode(node.path)!
      }
      treeNode.setNodeData(nodeToTreeData(node))
    }
    // ツリービューに引数ノードがまだ存在しない場合
    else {
      this.m_treeView.addNode(nodeToTreeData(node), {
        parent: node.dir || this.rootNode.path,
      })
    }
  }

  /**
   * ノードの移動を行います。
   * @param fromNodePath 移動するノードパス。例: 'home/development'
   * @param toNodePath 移動後のノードパス。例: 'work/dev'
   */
  moveNode(fromNodePath: string, toNodePath: string): void {
    fromNodePath = removeBothEndsSlash(fromNodePath)
    toNodePath = removeBothEndsSlash(toNodePath)

    // ツリービューから移動するノードとその配下のノードを取得
    const targetTreeTopNode = this.getNode(fromNodePath)!
    const targetTreeNodes = [targetTreeTopNode, ...targetTreeTopNode.getDescendants()]

    // ツリービューから移動先のノードを取得
    const existsTreeTopNode = this.getNode(toNodePath)

    // 移動ノード＋配下ノードのパスを移動先パスへ書き換え
    for (const targetTreeNode of targetTreeNodes) {
      const reg = new RegExp(`^${fromNodePath}`)
      const newTargetNodePath = targetTreeNode.path.replace(reg, toNodePath)
      targetTreeNode.setNodeData({
        value: newTargetNodePath,
        label: _path.basename(newTargetNodePath),
      })
    }

    // 移動ノードと同名のノードが移動先に存在しない場合
    if (!existsTreeTopNode) {
      const parentPath = removeStartDirChars(_path.dirname(toNodePath))
      const parentTreeNode = this.getNode(parentPath)!
      parentTreeNode.addChild(targetTreeTopNode)
    }
    // 移動ノードと同名のノードが移動先に存在する場合
    else {
      // 移動ノードをツリーから削除
      // ※この後の処理で移動ノードを移動先の同名ノードへ上書きすることにより、
      //   移動ノードは必要なくなるためツリービューから削除
      this.m_treeView.removeNode(targetTreeTopNode.path)

      // 移動ノード＋配下ノードを既存ノードへ付け替え
      const existsTreeNodes = [existsTreeTopNode, ...existsTreeTopNode.getDescendants()]
      const existsTreeNodeDict = arrayToDict(existsTreeNodes, 'value')
      for (const targetTreeNode of targetTreeNodes) {
        const existsTreeNode = existsTreeNodeDict[targetTreeNode.path]
        // 移動先に同名ノードが存在する場合
        if (existsTreeNode) {
          // 移動ノードを移動先の同名ノードへ上書き
          const toTreeNodeData = nodeToTreeData(targetTreeNode)
          delete toTreeNodeData.opened
          delete toTreeNodeData.lazyLoadStatus
          existsTreeNode.setNodeData(toTreeNodeData)
        }
        // 移動先に同名ノードが存在しない場合
        else {
          // 移動先のディレクトリを検索し、そのディレクトリに移動ノードを追加
          const parentPath = removeStartDirChars(_path.dirname(targetTreeNode.path))
          const parentTreeNode = existsTreeNodeDict[parentPath]
          existsTreeNodeDict[targetTreeNode.path] = parentTreeNode.addChild(targetTreeNode)
        }
      }
    }
  }

  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param paths
   */
  removeNodes(paths: string[]): void {
    for (const path of paths) {
      this.m_treeView.removeNode(path)
    }

    // 選択ノードがなくなってしまった場合
    if (!this.selectedNode) {
      this.selectedNode = this.rootNode
    }
  }

  /**
   * 指定されたパスと一致するツリーノードを削除します。
   * @param path
   */
  removeNode(path: string): void {
    this.removeNodes([path])
  }

  /**
   * ディレクトリの作成を行います。
   * @param dirPath 作成するディレクトリのパス
   */
  async createStorageDir(dirPath: string): Promise<void> {
    dirPath = removeBothEndsSlash(dirPath)

    // APIによるディレクトリ作成処理を実行
    let dirNode: StorageNode
    try {
      dirNode = (await this.storageLogic.createDirs([dirPath]))[0]
    } catch (err) {
      console.error(err)
      this.m_showNotification('error', String(this.$t('storage.create.creatingDirError', { nodeName: _path.basename(dirPath) })))
      return
    }

    // ツリービューに作成したディレクトリノードを追加
    this.setNode(dirNode)
    const dirTreeNode = this.getNode(dirPath)!
    // 作成したディレクトリの遅延ロード状態を済みに設定
    dirTreeNode.lazyLoadStatus = 'loaded'
  }

  /**
   * ノードの削除を行います。
   * @param nodePaths 削除するノードのパス
   */
  async removeStorageNodes(nodePaths: string[]): Promise<void> {
    nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

    // 引数チェック
    for (const nodePath of nodePaths) {
      if (nodePath === this.rootNode.path) {
        throw new Error(`The root node cannot be renamed.`)
      }
      // ストレージストアに指定ノードが存在するかチェック
      this.storageLogic.sgetNode({ path: nodePath })
    }

    const removedNodePaths: string[] = []

    // APIによる削除処理を実行
    for (const nodePath of nodePaths) {
      const node = this.storageLogic.sgetNode({ path: nodePath })
      try {
        switch (node.nodeType) {
          case StorageNodeType.Dir:
            await this.storageLogic.removeDir(node.path)
            removedNodePaths.push(node.path)
            break
          case StorageNodeType.File:
            await this.storageLogic.removeFile(node.path)
            removedNodePaths.push(node.path)
            break
        }
      } catch (err) {
        console.error(err)
        this.m_showNotification('error', String(this.$t('storage.delete.deletingError', { nodeName: node.name })))
      }
    }

    // ツリービューから引数ノードを削除
    this.removeNodes(removedNodePaths)
  }

  /**
   * ノードの移動を行います。
   * @param fromNodePaths 移動するノードのパス。例: ['home/dev', 'home/photos']
   * @param toDirPath 移動先のディレクトリパス。例: 'tmp'
   */
  async moveStorageNodes(fromNodePaths: string[], toDirPath: string): Promise<void> {
    fromNodePaths = fromNodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))
    toDirPath = removeBothEndsSlash(toDirPath)

    // 引数チェック
    for (const fromNodePath of fromNodePaths) {
      // 移動ノードがルートノードでないことを確認
      if (fromNodePath === this.rootNode.path) {
        throw new Error(`The root node cannot be moved.`)
      }

      // ストレージストアに指定ノードが存在するかチェック
      const fromNode = this.storageLogic.sgetNode({ path: fromNodePath })

      if (fromNode.nodeType === StorageNodeType.Dir) {
        // 移動先ディレクトリが移動対象のサブディレクトリでないことを確認
        // from: aaa/bbb → to: aaa/bbb/ccc/bbb [NG]
        //               → to: aaa/zzz/ccc/bbb [OK]
        if (toDirPath.startsWith(_path.join(fromNodePath, '/'))) {
          throw new Error(`The destination directory is its own subdirectory: '${fromNodePath}' -> '${toDirPath}'`)
        }
      }
    }

    //
    // 1. APIによる移動処理を実行
    //
    const movedNodes: StorageNode[] = []
    for (const fromNodePath of fromNodePaths) {
      const fromNode = this.storageLogic.sgetNode({ path: fromNodePath })
      const toNodePath = _path.join(toDirPath, fromNode.name)
      try {
        switch (fromNode.nodeType) {
          case StorageNodeType.Dir: {
            const nodes = await this.storageLogic.moveDir(fromNode.path, toNodePath)
            movedNodes.push(...nodes)
            break
          }
          case StorageNodeType.File: {
            const node = await this.storageLogic.moveFile(fromNode.path, toNodePath)
            movedNodes.push(node)
            break
          }
        }
      } catch (err) {
        console.error(err)
        this.m_showNotification('error', String(this.$t('storage.move.movingError', { nodeName: fromNode.name })))
      }
    }

    //
    // 2. 移動先ディレクトリの上位ディレクトリ階層の作成
    //
    const hierarchicalNodes = await this.storageLogic.fetchHierarchicalNodes(toDirPath)
    this.setNodes(hierarchicalNodes)

    //
    // 3. 移動ノードをツリービューに反映
    //
    const movedDirNodes = movedNodes.filter(this.nodeFilter)
    this.setNodes(
      movedDirNodes.map(storeNode => {
        if (storeNode.nodeType === StorageNodeType.Dir) {
          return Object.assign({}, storeNode, { lazyLoadStatus: 'loaded' })
        } else {
          return storeNode
        }
      })
    )
  }

  /**
   * ノードをリネームします。
   * また対象のツリーノードとその子孫のパスも変更されます。
   * @param nodePath リネームするノードのパス
   * @param newName ノードの新しい名前
   */
  async renameStorageNode(nodePath: string, newName: string): Promise<void> {
    nodePath = removeBothEndsSlash(nodePath)

    if (nodePath === this.rootNode.path) {
      throw new Error(`The root node cannot be renamed.`)
    }

    const targetNode = this.storageLogic.sgetNode({ path: nodePath })

    //
    // 1. APIによるリネーム処理を実行
    //
    const renamedNodes: StorageNode[] = []
    try {
      if (targetNode.nodeType === StorageNodeType.Dir) {
        const nodes = await this.storageLogic.renameDir(targetNode.path, newName)
        renamedNodes.push(...nodes)
      } else if (targetNode.nodeType === StorageNodeType.File) {
        const node = await this.storageLogic.renameFile(targetNode.path, newName)
        renamedNodes.push(node)
      }
    } catch (err) {
      console.error(err)
      this.m_showNotification('error', String(this.$t('storage.rename.renamingError', { nodeName: targetNode.name })))
      return
    }

    //
    // 2. リネームノードをツリービューに反映
    //
    const renamedDirNodes = renamedNodes.filter(this.nodeFilter)
    this.setNodes(
      renamedDirNodes.map(storeNode => {
        if (storeNode.nodeType === StorageNodeType.Dir) {
          return Object.assign({}, storeNode, { lazyLoadStatus: 'loaded' })
        } else {
          return storeNode
        }
      })
    )
  }

  /**
   * ノードの共有設定を行います。
   * @param nodePaths 共有設定するノードのパス
   * @param settings 共有設定の内容
   */
  async setShareSettings(nodePaths: string[], settings: StorageNodeShareSettings): Promise<void> {
    nodePaths = nodePaths.map(fromNodePath => removeBothEndsSlash(fromNodePath))

    // 引数チェック
    for (const nodePath of nodePaths) {
      if (nodePath === this.rootNode.path) {
        throw new Error(`The root node cannot be set share settings.`)
      }

      // ストレージストアに指定ノードが存在するかチェック
      this.storageLogic.sgetNode({ path: nodePath })
    }

    // APIによる共有設定処理を実行
    const processedNodes: StorageNode[] = []
    for (const nodePath of nodePaths) {
      const node = this.storageLogic.sgetNode({ path: nodePath })
      try {
        if (node.nodeType === StorageNodeType.Dir) {
          processedNodes.push(await this.storageLogic.setDirShareSettings(node.path, settings))
        } else if (node.nodeType === StorageNodeType.File) {
          processedNodes.push(await this.storageLogic.setFileShareSettings(node.path, settings))
        }
      } catch (err) {
        console.error(err)
        this.m_showNotification('error', String(this.$t('storage.share.sharingError', { nodeName: node.name })))
      }
    }

    // ツリービューに処理内容を反映
    const processedDirNodes = processedNodes.filter(this.nodeFilter)
    this.setNodes(processedDirNodes)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 指定されたIDと一致するツリーノードを取得します。
   * @param id
   */
  private m_getNodeById(id: string): StorageTreeNode | undefined {
    const allTreeNodes = this.m_treeView.getAllNodes()
    for (const treeNode of allTreeNodes) {
      if (treeNode.id === id) return treeNode
    }
    return undefined
  }

  /**
   * ロジックストアにないツリーノードを削除します。
   * @param storeNodes
   * @param treeNodes
   */
  private m_removeNotExistsTreeNodes(storeNodes: StorageNode[], treeNodes: StorageTreeNode[]): void {
    const apiNodeIdDict = arrayToDict(storeNodes, 'id')
    const apiNodePathDict = arrayToDict(storeNodes, 'path')

    const removingNodes: string[] = []
    for (const treeNode of treeNodes) {
      const exists = Boolean(apiNodeIdDict[treeNode.id] || apiNodePathDict[treeNode.path])
      !exists && removingNodes.push(treeNode.path)
    }

    this.removeNodes(removingNodes)
  }

  private m_showNotification(type: 'error' | 'warning', message: string): void {
    this.$q.notify({
      icon: type === 'error' ? 'error' : 'warning',
      position: 'bottom-left',
      message,
      timeout: 0,
      color: 'red',
      actions: [{ icon: 'close', color: 'white' }],
    })
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  @Watch('$logic.auth.isSignedIn')
  private async m_isSignedInOnChange(newValue: boolean, oldValue: boolean) {
    if (!this.$logic.auth.isSignedIn) {
      // 初期ストレージの読み込みフラグをクリアする
      this.pageStore.isInitialPull = false
      // 表示中のルートノード配下全ノードを削除し、ルートノードを選択ノードにする
      this.rootNode.removeAllChildren()
      this.selectedNode = this.rootNode
    }
  }

  private m_onSelect(e: CompTreeViewEvent<StorageTreeNode>) {
    // 初期読み込みが行われる前にルートノードのselectイベントが発生すると、
    // URLでノードパスが指定されてもそのパスがクリアされることになる。
    // このため初期読み込みが行われるまではselectイベントを発火しないようにしている。
    if (!this.pageStore.isInitialPull) return

    this.$emit('select', e)
  }

  private async m_onLazyLoad(e: CompTreeViewLazyLoadEvent<StorageTreeNode>) {
    this.$emit('lazy-load', e)
  }

  private async m_onContextMenuSelect(e: StorageNodeContextMenuSelectedEvent) {
    this.$emit('context-menu-select', e)
  }
}
</script>
