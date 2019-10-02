import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthRoleType, IdToken } from '../../../services/base'
import { GQLContext, Roles, User } from '../../../nest'
import { Inject, UseGuards, UseInterceptors } from '@nestjs/common'
import { SignedUploadUrlInput, StorageNode, StorageServiceDI } from '../../../services/business'
import { GQLCtx } from '../../decorators/context'
import { UserGuard } from '../../../nest/guards/user'

@Resolver('StorageNode')
export class StorageResolver {
  constructor(@Inject(StorageServiceDI.symbol) protected readonly storageService: StorageServiceDI.type) {}

  @Query()
  @UseGuards(UserGuard)
  async userStorageBasePath(@User() user: IdToken): Promise<string> {
    return this.storageService.getUserStorageDirPath(user)
  }

  @Query()
  @UseGuards(UserGuard)
  async userStorageNodes(@User() user: IdToken, @Args('dirPath') dirPath?: string): Promise<StorageNode[]> {
    return this.storageService.getUserStorageNodes(user, dirPath)
  }

  @Mutation()
  @UseGuards(UserGuard)
  async createUserStorageDirs(@User() user: IdToken, @Args('dirPaths') dirPaths: string[]): Promise<StorageNode[]> {
    return this.storageService.createUserStorageDirs(user, dirPaths)
  }

  @Mutation()
  @UseGuards(UserGuard)
  async removeUserStorageNodes(@User() user: IdToken, @Args('nodePaths') nodePaths: string[]): Promise<StorageNode[]> {
    return this.storageService.removeUserStorageNodes(user, nodePaths)
  }

  @Query()
  @UseGuards(UserGuard)
  @Roles(AuthRoleType.Admin)
  async signedUploadUrls(@GQLCtx() context: GQLContext, @Args('inputs') inputs: SignedUploadUrlInput[]): Promise<string[]> {
    const requestOrigin = (context.req.headers.origin as string) || ''
    return this.storageService.getSignedUploadUrls(requestOrigin, inputs)
  }
}
