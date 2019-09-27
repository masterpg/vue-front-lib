import * as admin from 'firebase-admin'
import * as path from 'path'
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthRoleType, IdToken } from '../../../services/base'
import { Inject, UseGuards, UseInterceptors } from '@nestjs/common'
import { SignedUploadUrlInput, StorageNode, StorageNodeType, StorageService } from '../../../services/business'
import { GQLContext } from '../../types'
import { GQLCtx } from '../../decorators/context'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { GQLUser } from '../../decorators/user'
import { GQLUserGuard } from '../../guards/user'
import { InputValidationError } from '../../../base/validator'
import { Roles } from '../../../nest/decorators/roles'
import { config } from '../../../base/config'
const isString = require('lodash/isString')

@Resolver('StorageNode')
@UseInterceptors(GQLLoggingInterceptor)
export class StorageResolver {
  constructor(@Inject(StorageService) private readonly storageService: StorageService) {}

  @Query()
  @UseGuards(GQLUserGuard)
  async userStorageBasePath(@GQLUser() user: IdToken): Promise<string> {
    return this.storageService.getUserStorageDirPath(user)
  }

  @Query()
  @UseGuards(GQLUserGuard)
  async userStorageNodes(@GQLUser() user: IdToken, @Args('dirPath') dirPath?: string): Promise<StorageNode[]> {
    if (dirPath && !dirPath.endsWith('/')) {
      throw new InputValidationError(`The argument 'dirPath' must end with '/'.`)
    }

    // Cloud Storageから指定されたディレクトリのノードを取得
    const userDirPath = this.storageService.getUserStorageDirPath(user)
    let nodeMap = await this.storageService.getStorageNodeMap(dirPath, userDirPath)

    // 親ディレクトリの穴埋め
    this.storageService.padVirtualDirNode(nodeMap)

    // ルートディレクトリ、または指定されたディレクトリのノードを除去する
    delete nodeMap[this.storageService.removeEndSlash(dirPath)]

    // ディレクトリ階層を表現できるようノード配列をソートする
    const result = Object.values(nodeMap)
    this.storageService.sortStorageNodes(result)

    return result
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async createUserStorageDirs(@GQLUser() user: IdToken, @Args('dirPaths') dirPaths: string[]): Promise<StorageNode[]> {
    for (const dirPath of dirPaths) {
      if (dirPath && !dirPath.endsWith('/')) {
        throw new InputValidationError(`The argument path of 'dirPaths' must end with '/'.`)
      }
    }

    const bucket = admin.storage().bucket()
    const userDirPath = this.storageService.getUserStorageDirPath(user)
    const result: StorageNode[] = []

    const promises: Promise<void>[] = []
    for (const dirPath of this.storageService.splitHierarchicalDirPaths(...dirPaths)) {
      promises.push(
        this.storageService.createStorageDir(bucket, dirPath, userDirPath).then(storageNode => {
          if (storageNode) {
            result.push(storageNode)
          }
        })
      )
    }
    await Promise.all(promises)

    return result
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async removeUserStorageNodes(@GQLUser() user: IdToken, @Args('nodePaths') nodePaths: string[]): Promise<StorageNode[]> {
    const result: StorageNode[] = []

    const bucket = admin.storage().bucket()
    const userDirPath = this.storageService.getUserStorageDirPath(user)
    const promises: Array<Promise<void>> = []
    for (const nodePath of nodePaths) {
      const nodeType = this.storageService.getStorageNodeType(nodePath)
      // ノードがディレクトリの場合
      if (nodeType === StorageNodeType.Dir) {
        promises.push(
          this.storageService.removeStorageDirNode(bucket, nodePath, userDirPath).then(nodes => {
            result.push(...nodes)
          })
        )
      }
      // ノードがファイルの場合
      else if (nodeType === StorageNodeType.File) {
        promises.push(
          this.storageService.removeStorageFileNode(bucket, nodePath, userDirPath).then(node => {
            node && result.push(node)
          })
        )
      }
    }
    await Promise.all(promises)

    return result
  }

  @Query()
  @UseGuards(GQLUserGuard)
  @Roles(AuthRoleType.Admin)
  async signedUploadUrls(@GQLCtx() context: GQLContext, @Args('inputs') inputs: SignedUploadUrlInput[]): Promise<string[]> {
    let requestOrigin = (context.req.headers.origin as string) || ''
    if (!isString(requestOrigin)) {
      throw new InputValidationError('Request origin is not set.')
    }
    if (!config.cors.whitelist.includes(requestOrigin)) {
      throw new InputValidationError('Request origin is invalid.', { requestOrigin })
    }

    const result: string[] = []

    for (const input of inputs) {
      const { filePath, contentType } = input
      const { fileName, dirPath } = this.storageService.splitFilePath(filePath)
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
