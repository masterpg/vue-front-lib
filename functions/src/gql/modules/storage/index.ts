import * as admin from 'firebase-admin'
import * as path from 'path'
import * as storage from '../../../base/storage'
import { Arg, Authorized, Ctx, Mutation, Query, Resolver } from 'type-graphql'
import { SignedUploadUrlParam, StorageNode, StorageNodeType } from './types'
import { AuthRoleType } from '../../../base/auth'
import { Context } from '../../types'
import { GQLError } from '../../base'
import { config } from '../../../base/config'
const isString = require('lodash/isString')

@Resolver(of => StorageNode)
export class StorageResolver {
  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  @Query(returns => String)
  @Authorized()
  async userStorageBasePath(@Ctx() ctx: Context): Promise<string> {
    return storage.getUserStorageDirPath(ctx.user!)
  }

  @Query(returns => [StorageNode])
  @Authorized()
  async userStorageNodes(@Ctx() ctx: Context, @Arg('dirPath', returns => String, { nullable: true }) dirPath?: string): Promise<StorageNode[]> {
    if (dirPath && !dirPath.endsWith('/')) {
      throw new GQLError(`The argument 'dirPath' must end with '/'.`)
    }

    // Cloud Storageから指定されたディレクトリのノードを取得
    const userDirPath = storage.getUserStorageDirPath(ctx.user!)
    let nodeMap = await storage.getStorageNodeMap(dirPath, userDirPath)

    // 親ディレクトリの穴埋め
    storage.padVirtualDirNode(nodeMap)

    // ルートディレクトリ、または指定されたディレクトリのノードを除去する
    delete nodeMap[storage.removeEndSlash(dirPath)]

    // ディレクトリ階層を表現できるようノード配列をソートする
    const result = Object.values(nodeMap)
    storage.sortStorageNodes(result)

    return result
  }

  @Mutation(returns => [StorageNode])
  @Authorized()
  async createUserStorageDirs(@Ctx() ctx: Context, @Arg('dirPaths', returns => [String]) dirPaths: string[]): Promise<StorageNode[]> {
    for (const dirPath of dirPaths) {
      if (dirPath && !dirPath.endsWith('/')) {
        throw new GQLError(`The argument path of 'dirPaths' must end with '/'.`)
      }
    }

    const bucket = admin.storage().bucket()
    const userDirPath = storage.getUserStorageDirPath(ctx.user!)
    const result: StorageNode[] = []

    const promises: Promise<void>[] = []
    for (const dirPath of storage.splitHierarchicalDirPaths(...dirPaths)) {
      promises.push(
        storage.createStorageDir(bucket, dirPath, userDirPath).then(storageNode => {
          if (storageNode) {
            result.push(storageNode)
          }
        })
      )
    }
    await Promise.all(promises)

    return result
  }

  @Mutation(returns => [StorageNode])
  @Authorized()
  async removeUserStorageNodes(@Ctx() ctx: Context, @Arg('nodePaths', returns => [String]) nodePaths: string[]): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    const bucket = admin.storage().bucket()
    const userDirPath = storage.getUserStorageDirPath(ctx.user!)
    const promises: Array<Promise<void>> = []
    for (const nodePath of nodePaths) {
      const nodeType = storage.getStorageNodeType(nodePath)
      // ノードがディレクトリの場合
      if (nodeType === StorageNodeType.Dir) {
        promises.push(
          storage.removeStorageDirNode(bucket, nodePath, userDirPath).then(nodes => {
            result.push(...nodes)
          })
        )
      }
      // ノードがファイルの場合
      else if (nodeType === StorageNodeType.File) {
        promises.push(
          storage.removeStorageFileNode(bucket, nodePath, userDirPath).then(node => {
            node && result.push(node)
          })
        )
      }
    }
    await Promise.all(promises)

    return result
  }

  @Query(returns => [String])
  @Authorized([AuthRoleType.Admin])
  async signedUploadUrls(@Ctx() ctx: Context, @Arg('params', returns => [SignedUploadUrlParam]) params: SignedUploadUrlParam[]): Promise<string[]> {
    let requestOrigin = (ctx.req.headers.origin as string) || ''
    if (!isString(requestOrigin)) {
      throw new GQLError('Request origin is not set.')
    }
    if (!config.cors.whitelist.includes(requestOrigin)) {
      throw new GQLError('Request origin is invalid.', { requestOrigin })
    }

    const result: string[] = []

    for (const param of params) {
      const { filePath, contentType } = param
      const { fileName, dirPath } = storage.splitFilePath(filePath)
      const bucket = admin.storage().bucket()
      const gcsFilePath = path.join(dirPath, fileName)
      const gcsFileNode = bucket.file(gcsFilePath)

      const url = (await gcsFileNode.createResumableUpload({
        origin: requestOrigin,
        metadata: { contentType },
      }))[0]
      result.push(url)
    }

    return result
  }
}
