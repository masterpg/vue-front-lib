import { Query, Resolver } from '@nestjs/graphql'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { AppService } from '../../../services/business'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { IdToken } from '../../../services/base'
import { User } from '../../../nest'
import { UserGuard } from '../../../nest/guards/user'

@Resolver()
@UseInterceptors(GQLLoggingInterceptor)
export class AppResolver {
  constructor(private readonly commService: AppService) {}

  @Query()
  @UseGuards(UserGuard)
  async customToken(@User() user: IdToken): Promise<string> {
    return this.commService.customToken(user)
  }
}
