import { Args, Mutation, Query, Resolver } from '@nestjs/graphql'
import { AuthRoleType, IdToken } from '../../../services/base'
import { Inject, UseGuards, UseInterceptors } from '@nestjs/common'
import { SignedUploadUrlInput, StorageNode, StorageService } from '../../../services/business'
import { GQLContext } from '../../types'
import { GQLCtx } from '../../decorators/context'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { GQLUser } from '../../decorators/user'
import { GQLUserGuard } from '../../guards/user'
import { Roles } from '../../../nest/decorators/roles'

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
    return this.storageService.getUserStorageNodes(user, dirPath)
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async createUserStorageDirs(@GQLUser() user: IdToken, @Args('dirPaths') dirPaths: string[]): Promise<StorageNode[]> {
    return this.storageService.createUserStorageDirs(user, dirPaths)
  }

  @Mutation()
  @UseGuards(GQLUserGuard)
  async removeUserStorageNodes(@GQLUser() user: IdToken, @Args('nodePaths') nodePaths: string[]): Promise<StorageNode[]> {
    return this.storageService.removeUserStorageNodes(user, nodePaths)
  }

  @Query()
  @UseGuards(GQLUserGuard)
  @Roles(AuthRoleType.Admin)
  async signedUploadUrls(@GQLCtx() context: GQLContext, @Args('inputs') inputs: SignedUploadUrlInput[]): Promise<string[]> {
    const requestOrigin = (context.req.headers.origin as string) || ''
    return this.storageService.getSignedUploadUrls(requestOrigin, inputs)
  }
}
