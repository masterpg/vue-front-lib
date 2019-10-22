//
// Google Cloud Storage: Node.js Client
// https://googleapis.dev/nodejs/storage/latest/index.html
//

import * as admin from 'firebase-admin'
import * as path from 'path'
import { Bucket, File } from '@google-cloud/storage'
import { StorageNode, StorageNodeType, SignedUploadUrlInput as _SignedUploadUrlInput, StorageNode as _StorageNode } from './types'
import { removeBothEndsSlash, removeEndSlash, removeStartSlash, splitFilePath } from 'web-base-lib'
import { Injectable } from '@nestjs/common'

export class SignedUploadUrlInput implements _SignedUploadUrlInput {
  filePath!: string
  contentType?: string
}

export interface GCSStorageNode extends _StorageNode {
  gcsNode?: File
}

@Injectable()
class StorageService {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ローカルファイルをCloud Storageへアップロードします。
   * @param uploadList
   */
  async uploadLocalFiles(uploadList: { localFilePath: string; toFilePath: string }[]): Promise<StorageNode[]> {
    const bucket = admin.storage().bucket()
    const promises: Promise<StorageNode>[] = []
    for (const uploadItem of uploadList) {
      promises.push(
        bucket.upload(uploadItem.localFilePath, { destination: uploadItem.toFilePath }).then(response => {
          const file = response[0]
          const metadata = response[1]
          return this.toStorageNode(file)
        })
      )
    }
    return Promise.all(promises)
  }

  /**
   * Cloud Storageから指定されたディレクトリのノード一覧を取得します。
   *
   * 引数が次のように指定された場合、
   *   + dirPath: "photos"
   *   + basePath: "home"
   * 次のようなノードが取得されます。
   *   + "home/photos/family.png"
   *   + "home/photos/children.png"
   * 戻り値は基準パスのノードが除去され、次のようなノードが返されます。
   *   + "photos/family.png"
   *   + "photos/children.png"
   *
   * @param dirPath
   * @param basePath
   */
  async getStorageDirNodes(dirPath?: string, basePath?: string): Promise<StorageNode[]> {
    // Cloud Storageから指定されたディレクトリのノードを取得
    const nodeMap = await this.getStorageNodeMap(dirPath, basePath)

    // 親ディレクトリの穴埋め
    this.padVirtualDirNode(nodeMap)

    // ディレクトリ階層を表現できるようノード配列をソート
    const result = Object.values(nodeMap)
    this.sortStorageNodes(result)

    return result
  }

  /**
   * Cloud Storageのユーザーディレクトリから指定されたディレクトリのノード一覧を取得します。
   * @param user
   * @param dirPath
   */
  async getUserStorageDirNodes(user: { uid: string }, dirPath?: string): Promise<StorageNode[]> {
    const userDirPath = this.getUserStorageDirPath(user)
    return this.getStorageDirNodes(dirPath, userDirPath)
  }

  /**
   * Cloud Storageのディレクトリを作成します。
   *
   * 引数が次のように指定された場合、
   *   + dirPaths[0]: "photos"
   *   + dirPaths[1]: "docs"
   *   + basePath: "home"
   * 次のディレクトリが作成されます。
   *   + "home/photos"
   *   + "home/docs"
   * 戻り値は基準パスのノードが除去され、次のようなノードが返されます。
   *   + "photos"
   *   + "docs"
   *
   * @param dirPaths
   * @param basePath
   */
  async createStorageDirs(dirPaths: string[], basePath: string = ''): Promise<StorageNode[]> {
    const bucket = admin.storage().bucket()
    const result: StorageNode[] = []

    const promises: Promise<void>[] = []
    for (const dirPath of this.splitHierarchicalDirPaths(...dirPaths)) {
      promises.push(
        (async () => {
          const gcsDirPath = path.join(basePath, dirPath, '/')
          const gcsDirNode = bucket.file(gcsDirPath)
          const exists = (await gcsDirNode.exists())[0]
          if (exists) return
          await gcsDirNode.save('')
          result.push(this.toStorageNode(gcsDirNode, basePath))
        })()
      )
    }
    await Promise.all(promises)

    this.sortStorageNodes(result)
    return result
  }

  /**
   * Cloud Storageのユーザーディレクトリ配下にディレクトリを作成します。
   * @param user
   * @param dirPaths
   */
  async createUserStorageDirs(user: { uid: string }, dirPaths: string[]): Promise<StorageNode[]> {
    const userDirPath = this.getUserStorageDirPath(user)
    return this.createStorageDirs(dirPaths, userDirPath)
  }

  /**
   * Cloud Storageからファイルノードを削除します。
   *
   * 引数が次のように指定された場合、
   *   + filePaths[0]: "photos/family.png"
   *   + filePaths[1]: "photos/children.png"
   *   + basePath: "home"
   * 次のファイルが削除されます。
   *   + "home/photos/family.png"
   *   + "home/photos/children.png"
   * 戻り値は基準パスのノードが除去され、次のようなノードが返されます。
   *   + "photos/family.png"
   *   + "photos/children.png"
   *
   * @param filePaths
   * @param basePath
   */
  async removeStorageFiles(filePaths: string[], basePath: string = ''): Promise<StorageNode[]> {
    const bucket = admin.storage().bucket()
    const nodeMap: { [path: string]: StorageNode } = {}

    const promises: Promise<void>[] = []
    for (const filePath of filePaths) {
      promises.push(
        (async () => {
          const gcsFilePath = removeBothEndsSlash(path.join(basePath, filePath))
          const gcsFileNode = bucket.file(gcsFilePath)
          const exists = (await gcsFileNode.exists())[0]
          if (exists) {
            await gcsFileNode.delete()
            const node = this.toStorageNode(gcsFileNode, basePath)
            nodeMap[node.path] = node
          }
        })()
      )
    }
    await Promise.all(promises)

    return filePaths.reduce<StorageNode[]>((result, filePath) => {
      const fileNode = nodeMap[removeBothEndsSlash(filePath)]
      fileNode && result.push(fileNode)
      return result
    }, [])
  }

  /**
   * Cloud Storageのユーザーディレクトリ配下にあるファイルを削除します。。
   * @param user
   * @param filePaths
   */
  async removeUserStorageFiles(user: { uid: string }, filePaths: string[]): Promise<StorageNode[]> {
    const userDirPath = this.getUserStorageDirPath(user)
    return this.removeStorageFiles(filePaths, userDirPath)
  }

  /**
   * Cloud Storageから指定されたディレクトリを含め配下のノードを削除します。
   *
   * 引数が次のように指定された場合、
   *   + dirPath: "photos"
   *   + basePath: "home"
   * 次のようなディレクトリ、ファイルが削除されます。
   *   + "home/photos"
   *   + "home/photos/family.png"
   *   + "home/photos/children.png"
   * 戻り値は基準パスのノードが除去され、次のようなノードが返されます。
   *   + "photos"
   *   + "photos/family.png"
   *   + "photos/children.png"
   *
   * @param dirPath
   * @param basePath
   */
  async removeStorageDir(dirPath: string, basePath: string = ''): Promise<StorageNode[]> {
    // Cloud Storageから指定されたディレクトリのノードを取得
    const nodeMap = await this.getStorageNodeMap(dirPath, basePath)
    // 親ディレクトリの穴埋め
    this.padVirtualDirNode(nodeMap, dirPath)

    // Cloud Storageから取得したノードを削除
    const promises: Promise<StorageNode>[] = []
    for (const node of Object.values(nodeMap)) {
      if (node.gcsNode) {
        promises.push(node.gcsNode.delete().then(() => node))
      }
    }
    const nodes = await Promise.all(promises)

    this.sortStorageNodes(nodes)
    return nodes
  }

  /**
   * Cloud Storageのユーザーディレクトリ配下にあるファイルを削除します。。
   * @param user
   * @param dirPath
   */
  async removeUserStorageDir(user: { uid: string }, dirPath: string): Promise<StorageNode[]> {
    const userDirPath = this.getUserStorageDirPath(user)
    return this.removeStorageDir(dirPath, userDirPath)
  }

  /**
   * 署名付きのアップロードURLを取得します。
   * @param requestOrigin
   * @param inputs
   */
  async getSignedUploadUrls(requestOrigin: string, inputs: SignedUploadUrlInput[]): Promise<string[]> {
    const bucket = admin.storage().bucket()
    const urlMap: { [path: string]: string } = {}

    for (const input of inputs) {
      const { filePath, contentType } = input
      const { fileName, dirPath } = splitFilePath(filePath)
      const gcsFilePath = path.join(dirPath, fileName)
      const gcsFileNode = bucket.file(gcsFilePath)

      urlMap[filePath] = (await gcsFileNode.createResumableUpload({
        origin: requestOrigin,
        metadata: { contentType },
      }))[0]
    }

    return inputs.map(input => urlMap[input.filePath])
  }

  /**
   * Cloud Storageからノードを取得します。
   * `dirPath`を指定すると、このディレクトリパス配下のノードを取得します。
   * @param dirPath
   * @param basePath
   */
  async getStorageNodeMap(dirPath: string = '', basePath: string = ''): Promise<{ [path: string]: GCSStorageNode }> {
    // 引数のディレクトリパスをCloud Storageのパスへ変換
    let gcsDirPath = ''
    if (dirPath || basePath) {
      basePath = removeBothEndsSlash(basePath)
      dirPath = removeBothEndsSlash(dirPath)
      gcsDirPath = path.join(basePath, dirPath, '/')
    }

    // Cloud Storageから指定されたディレクトリのノードを取得
    const bucket = admin.storage().bucket()
    const response = await bucket.getFiles({ prefix: gcsDirPath })
    const gcsNodes = response[0] as File[]

    const result: { [path: string]: GCSStorageNode } = {}

    for (const gcsNode of gcsNodes) {
      // basePathが指定されかつ、basePathと取得ノードが一致した場合、無視する
      if (basePath && `${basePath}/` === gcsNode.name) {
        continue
      }
      const node = this.toStorageNode(gcsNode, basePath) as GCSStorageNode
      node.gcsNode = gcsNode
      result[node.path] = node
    }

    return result
  }

  /**
   * Cloud Storageから取得したノードをStorageNodeへ変換します。
   *
   * `basePath`が指定された場合、`gcsNode`のパスから基準パスが除去されます。
   * 引数が次のような場合:
   *   + `gcsNode`のパス: users/[USER_ID]/images/family.png
   *   + `basePath`: users/[USER_ID]
   * `gcsNode`のパスから基準パスが除去され、戻り値のノードパスは次のようになります:
   *   + images/family.png
   *
   * @param gcsNode Cloud Storageのノードを指定
   * @param basePath 基準パスを指定
   */
  toStorageNode(gcsNode: File, basePath: string = ''): StorageNode {
    let nodePath = removeBothEndsSlash(gcsNode.name)
    if (basePath) {
      basePath = removeBothEndsSlash(basePath)
      const basePathReg = new RegExp(`^${basePath}`)
      nodePath = removeBothEndsSlash(nodePath.replace(basePathReg, ''))
    }
    const relativePathSegments = nodePath.split('/')
    const name = relativePathSegments[relativePathSegments.length - 1]
    const dir = relativePathSegments.slice(0, relativePathSegments.length - 1).join('/')

    // ノード名の末尾が'/'の場合はディレクトリ、それ以外はファイルと判定
    const nodeType = gcsNode.name.match(/\/$/) ? StorageNodeType.Dir : StorageNodeType.File

    return {
      nodeType,
      name,
      dir: removeStartSlash(dir),
      path: removeStartSlash(nodePath),
    }
  }

  /**
   * 指定されたディレクトリパスをStorageNodeのディレクトリノードへ変換します。
   * @param dirPath
   */
  toDirStorageNode(dirPath: string) {
    const dirPathSegments = dirPath.split('/')
    const name = dirPathSegments[dirPathSegments.length - 1]
    const dir = dirPathSegments.slice(0, dirPathSegments.length - 1).join('/')

    return { nodeType: StorageNodeType.Dir, name, dir, path: dirPathSegments.join('/') }
  }

  /**
   * ノード配列をディレクトリ階層に従ってソートします。
   * @param nodes
   */
  sortStorageNodes(nodes: StorageNode[]): void {
    nodes.sort((a, b) => {
      // ソート用文字列(strA, strB)の説明:
      //   ノードがファイルの場合、同じ階層にあるディレクトリより順位を下げるために
      //   大きな文字コード"0xffff"を付加している。これにより同一階層のファイルと
      //   ディレクトリを比較した際、ファイルの方が文字的に大きいと判断され、下の方へ
      //   配置されることになる。

      let strA = a.path
      let strB = b.path
      if (a.nodeType === StorageNodeType.File) {
        strA = `${a.dir}${String.fromCodePoint(0xffff)}${a.name}`
      }
      if (b.nodeType === StorageNodeType.File) {
        strB = `${b.dir}${String.fromCodePoint(0xffff)}${b.name}`
      }

      if (strA < strB) {
        return -1
      } else if (strA > strB) {
        return 1
      } else {
        return 0
      }
    })
  }

  /**
   * ユーザーディレクトリのパスを取得します。
   * @param user
   */
  getUserStorageDirPath(user: { uid: string }): string {
    return `users/${user.uid}`
  }

  /**
   * 親ディレクトリがない場合、仮想的にディレクトリを作成して穴埋めします。
   * このようなことを行う理由として、Cloud Storageは親ディレクトリが存在しないことがあるためです。
   * 例えば、"aaa/bbb/family.png"の場合、"aaa/bbb/"というディレクトリがない場合があります。
   * このように親ディレクトリがない場合、仮想的にディレクトリを作成して穴埋めします。
   *
   * `basePath`は基準パスで、このパスより上位のディレクトリは作成しません。
   * 例えば、"aaa/bbb/ccc/family.png"というノードがあり、ディレクトリが存在しないとします。
   * この条件で`basePath`に"aaa/bbb"を指定すると次のようにディレクトリノードが作成されます。
   * + "aaa" ← 基準パスより上なので作成されない
   * + "aaa/bbb" ← 作成される
   * + "aaa/bbb/ccc" ← 作成される
   *
   * @param nodeMap
   * @param basePath
   */
  padVirtualDirNode(nodeMap: { [path: string]: StorageNode }, basePath?: string): void {
    basePath = removeEndSlash(basePath)
    // 指定された全ノードの階層的なディレクトリパスを取得
    const dirPaths = Object.values(nodeMap).map(node => node.dir)
    const hierarchicalDirPaths = this.splitHierarchicalDirPaths(...dirPaths)

    // 親ディレクトリがない場合、仮想的にディレクトリを作成して穴埋めする
    for (const dirPath of hierarchicalDirPaths) {
      if (basePath && !dirPath.startsWith(basePath)) continue
      if (nodeMap[dirPath]) continue
      nodeMap[dirPath] = this.toDirStorageNode(dirPath)
    }
  }

  /**
   * 指定されたディレクトリパスを階層的に分割します。
   *
   * 例: "aaa/bbb/ccc"が指定された場合、
   *    ["aaa", "aaa/bbb", "aaa/bbb/ccc"]を返します。
   *
   * @param dirPaths
   */
  splitHierarchicalDirPaths(...dirPaths: string[]): string[] {
    const set: Set<string> = new Set<string>()

    for (const dirPath of dirPaths) {
      const dirPathSegments = dirPath.split('/').filter(item => !!item)
      for (let i = 0; i < dirPathSegments.length; i++) {
        const currentDirPath = dirPathSegments.slice(0, i + 1).join('/')
        set.add(currentDirPath)
      }
    }

    return Array.from(set)
  }

  /**
   * ディレクトリリストをサマリーします。
   *
   * `dirPaths`に次が指定された場合:
   *   + dir1/dir1-1
   *   + dir1/dir1-1/dir1-1-1
   *   + dir1/dir1-1/dir1-1-2
   *   + dir2/dir2-1
   *   + dir2/dir2-1/dir2-1-1
   *
   * 結果として次のようにサマリーされます:
   *   + dir1/dir1-1/dir1-1-1
   *   + dir1/dir1-1/dir1-1-2
   *   + dir2/dir2-1/dir2-1-1
   */
  summarizeDirPaths(dirPaths: string[]): string[] {
    const pushMaxDirPathToArray = (array: string[], newDirPath: string) => {
      for (let i = 0; i < array.length; i++) {
        const dirPath = array[i]
        if (dirPath.startsWith(newDirPath)) {
          return
        } else if (newDirPath.startsWith(dirPath)) {
          array[i] = newDirPath
          return
        }
      }
      array.push(newDirPath)
    }

    const result: string[] = []
    for (const dirPath of dirPaths) {
      pushMaxDirPathToArray(result, dirPath)
    }
    return result
  }
}

export namespace StorageServiceDI {
  export const symbol = Symbol(StorageService.name)
  export const provider = {
    provide: symbol,
    useClass: StorageService,
  }
  export type type = StorageService
}
