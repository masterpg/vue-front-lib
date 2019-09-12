//
// Google Cloud Storage: Node.js Client
// https://googleapis.dev/nodejs/storage/latest/index.html
//

import * as admin from 'firebase-admin'
import * as path from 'path'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { StorageNode, StorageNodeType } from './types'
import { Context } from '../../types'
import { File } from '@google-cloud/storage'
import { GQLError } from '../../base'
import { IdToken } from '../../../base'
import { Validator } from 'class-validator'

class GSNode extends StorageNode {
  gsNode?: File
}

@Resolver(of => StorageNode)
export class StorageResolver {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  @Query(returns => [StorageNode])
  @Authorized()
  async userStorageNodes(@Ctx() ctx: Context, @Arg('dirPath', returns => String, { nullable: true }) dirPath?: string): Promise<StorageNode[]> {
    if (dirPath && !dirPath.endsWith('/')) {
      throw new GQLError(`The argument 'dirPath' must end with '/'.`)
    }

    // Cloud Storageから指定されたディレクトリのノードを取得
    let nodeMap = await this.m_getGSNodeMap(ctx.user!, dirPath)

    // 親ディレクトリの穴埋め
    this.m_padVirtualDirNode(nodeMap)

    // ルートディレクトリ、または指定されたディレクトリのノードを除去する
    delete nodeMap[this.m_removeEndSlash(dirPath)]

    // ディレクトリ階層を表現できるようノード配列をソートする
    const result = Object.values(nodeMap)
    this.m_sortNodes(result)

    return result
  }

  @Mutation(returns => [StorageNode])
  @Authorized()
  async createStorageDir(@Ctx() ctx: Context, @Arg('dirPath', returns => String) dirPath: string): Promise<StorageNode[]> {
    const validator = new Validator()
    if (validator.isEmpty(dirPath)) {
      throw new GQLError(`The argument 'dirPath' is empty.`)
    }
    if (dirPath && !dirPath.endsWith('/')) {
      throw new GQLError(`The argument 'dirPath' must end with '/'.`)
    }

    const userDirPath = this.m_getUserDirPath(ctx.user!)
    const bucket = admin.storage().bucket()

    const result: StorageNode[] = []
    const dirPathSegments = dirPath.split('/').filter(item => !!item)
    for (let i = 0; i < dirPathSegments.length; i++) {
      const parentDirPath = dirPathSegments.slice(0, i + 1).join('/')
      const dirPath = path.join(userDirPath, parentDirPath, '/')
      const dir = bucket.file(dirPath)
      const exists = (await dir.exists())[0]
      if (!exists) {
        await dir.save('')
        result.push(this.m_toStorageNode(ctx.user!, dir))
      }
    }

    return result
  }

  @Mutation(returns => [StorageNode])
  @Authorized()
  async removeStorageNodes(@Ctx() ctx: Context, @Arg('nodePaths', returns => [String]) nodePaths: string[]): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    const promises: Array<Promise<void>> = []
    for (const nodePath of nodePaths) {
      const nodeType = this.m_getNodeType(nodePath)
      // ノードがディレクトリの場合
      if (nodeType === StorageNodeType.Dir) {
        promises.push(
          this.m_removeDirNode(ctx.user!, nodePath).then(nodes => {
            result.push(...nodes)
          })
        )
      }
      // ノードがファイルの場合
      else if (nodeType === StorageNodeType.File) {
        promises.push(
          this.m_removeFileNode(ctx.user!, nodePath).then(node => {
            node && result.push(node)
          })
        )
      }
    }
    await Promise.all(promises)

    return result
  }

  /**
   * Cloud Storageからファイルノードを削除します。
   * @param user
   * @param filePath
   */
  private async m_removeFileNode(user: IdToken, filePath: string): Promise<StorageNode | undefined> {
    const bucket = admin.storage().bucket()
    const gsFilePath = path.join(this.m_getUserDirPath(user), filePath)
    const gsFileNode = bucket.file(gsFilePath)
    const exists = (await gsFileNode.exists())[0]
    if (exists) {
      return gsFileNode.delete().then(() => {
        return this.m_toStorageNode(user, gsFileNode)
      })
    }
    return undefined
  }

  /**
   * Cloud Storageから指定されたディレクトリ含め配下のノードを削除します。
   * @param user
   * @param dirPath
   */
  private async m_removeDirNode(user: IdToken, dirPath: string): Promise<StorageNode[]> {
    // Cloud Storageから指定されたディレクトリのノードを取得
    let nodeMap = await this.m_getGSNodeMap(user, dirPath)
    // 親ディレクトリの穴埋め
    this.m_padVirtualDirNode(nodeMap, dirPath)

    const promises: Promise<StorageNode>[] = []
    for (const node of Object.values(nodeMap)) {
      if (node.gsNode) {
        promises.push(node.gsNode.delete().then(() => node))
      } else {
        promises.push(new Promise<StorageNode>(resolve => resolve(node)))
      }
    }
    return Promise.all(promises)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * Cloud Storageからのノードを取得します。
   * `dirPath`を指定するとこのディレクトリパス配下のノードが取得されます。
   * @param user
   * @param dirPath
   */
  private async m_getGSNodeMap(user: IdToken, dirPath?: string): Promise<{ [path: string]: GSNode }> {
    // 引数のディレクトリパスをCloud Storageのパスへ変換
    let gsUserRootPath = path.join(this.m_getUserDirPath(user), '/')
    let gsDirPath = gsUserRootPath
    if (dirPath) {
      gsDirPath = path.join(gsUserRootPath, dirPath, '/')
    }

    // Cloud Storageから指定されたディレクトリのノードを取得
    const bucket = admin.storage().bucket()
    const gsNodes = (await bucket.getFiles({ prefix: gsDirPath }))[0] as File[]

    const result: { [path: string]: GSNode } = {}

    // 引数のディレクトリパス配下のノードをCloud Storageから取得
    for (const gsNode of gsNodes) {
      const node = this.m_toStorageNode(user, gsNode) as GSNode
      node.gsNode = gsNode
      result[node.path] = node
    }

    return result
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param nodes
   * @param desc 降順にしたい場合はtrueを指定
   */
  private m_sortNodes(nodes: StorageNode[], desc: boolean = false): void {
    nodes.sort((a, b) => {
      // ソート用文字列(strA, strB)の説明:
      //   ノードがファイルの場合、同じ階層にあるディレクトリより順位を下げるために
      //   大きな文字コード"0xffff"を付加している。これにより同一階層のファイルと
      //   ディレクトリを比較した際、ファイルの方が文字的に大きいと判断され、下の方へ
      //   配置されることになる。

      let strA = a.path
      if (a.nodeType === StorageNodeType.File) {
        strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
      }

      let strB = b.path
      if (b.nodeType === StorageNodeType.File) {
        strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
      }

      if (strA < strB) {
        return desc ? 1 : -1
      } else if (strA > strB) {
        return desc ? -1 : 1
      } else {
        return 0
      }
    })
  }

  /**
   * 親ディレクトリがない場合、仮想的にディレクトリを作成して穴埋めします。
   * このようなことを行う理由として、Cloud Storageは親ディレクトリが存在しないことがあるためです。
   * 例えば、"aaa/bbb/family.png"の場合、"aaa/bbb/"というディレクトリがない場合があります。
   * このように親ディレクトリがない場合、想的にディレクトリを作成して穴埋めします。
   *
   * `baseDirPath`は基準ディレクトリパスで、このパスより上位のディレクトリは作成しません。
   * 例えば、"aaa/bbb/ccc/family.png"というノードがあり、ディレクトリが存在しないとします。
   * この条件でbaseDirPathに"aaa/bbb"を指定すると、以下のようにディレクトリノードが作成されます。
   * + "aaa" ← 作成されない
   * + "aaa/bbb" ← 作成される
   * + "aaa/bbb/ccc" ← 作成される
   *
   * @param nodeMap
   * @param baseDirPath
   */
  private m_padVirtualDirNode(nodeMap: { [path: string]: GSNode }, baseDirPath?: string): void {
    baseDirPath = this.m_removeEndSlash(baseDirPath)

    // 指定された全ノードの祖先ディレクトリパスを取得
    let ancestorDirPaths: Set<string> = new Set<string>()
    for (const nodePath of Object.keys(nodeMap)) {
      const node = nodeMap[nodePath]
      const addedAncestorDirPaths = this.m_getAncestorDirPaths(node.dir)
      ancestorDirPaths = new Set<string>([...ancestorDirPaths, ...addedAncestorDirPaths])
    }

    // 親ディレクトリがない場合、仮想的にディレクトリを作成して穴埋めする
    for (const ancestorDirPath of ancestorDirPaths) {
      if (!ancestorDirPath.startsWith(baseDirPath)) continue
      if (nodeMap[ancestorDirPath]) continue
      nodeMap[ancestorDirPath] = this.toDirStorageNode(ancestorDirPath)
    }
  }

  /**
   * Cloud Storageから取得したノードをStorageNodeへ変換します。
   * @param user
   * @param gsNode
   */
  private m_toStorageNode(user: IdToken, gsNode: File): StorageNode {
    const userDirPath = path.join(this.m_getUserDirPath(user), '/')
    const nodePath = gsNode.name.replace(userDirPath, '').replace(/\/$/, '')
    const relativePathSegments = nodePath.split('/')
    const name = relativePathSegments[relativePathSegments.length - 1]
    const dir = relativePathSegments.slice(0, relativePathSegments.length - 1).join('/')

    return { nodeType: this.m_getNodeType(gsNode.name), name, dir, path: nodePath }
  }

  /**
   * 指定されたディレクトリパスをStorageNodeのディレクトリノードへ変換します。
   * @param dirPath
   */
  private toDirStorageNode(dirPath: string) {
    const dirPathSegments = dirPath.split('/')
    const name = dirPathSegments[dirPathSegments.length - 1]
    const dir = dirPathSegments.slice(0, dirPathSegments.length - 1).join('/')

    return { nodeType: StorageNodeType.Dir, name, dir, path: dirPathSegments.join('/') }
  }

  /**
   * ノード名からノードタイプを判別し、取得します。
   * @param nameOrPath
   */
  private m_getNodeType(nameOrPath: string): StorageNodeType {
    // ノード名の末尾が'/'の場合はディレクトリ、それ以外はファイルと判定
    return nameOrPath.match(/\/$/) ? StorageNodeType.Dir : StorageNodeType.File
  }

  /**
   * ユーザーディレクトリのパスを取得します。
   * @param user
   */
  private m_getUserDirPath(user: IdToken): string {
    return `users/${user.uid}`
  }

  /**
   * 指定されたディレクトリパスを分割し、
   * 自身を含め祖先のディレクトリパスを取得します。
   *
   * 例: "aaa/bbb/ccc"が指定された場合、
   *    ["aaa", "aaa/bbb", "aaa/bbb/ccc"]を返します。
   *
   * @param dirPath
   */
  private m_getAncestorDirPaths(dirPath: string): string[] {
    const result: string[] = []
    const dirPathSegments = dirPath.split('/')
    for (let i = 0; i < dirPathSegments.length; i++) {
      const currentDirPath = dirPathSegments.slice(0, i + 1).join('/')
      result.push(currentDirPath)
    }
    return result
  }

  /**
   * パス末尾のスラッシュを除去します。
   * @param nodePath
   */
  private m_removeEndSlash(nodePath?: string): string {
    if (!nodePath) return ''
    return nodePath.replace(/\/$/, '')
  }
}
