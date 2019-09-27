import { Query, Resolver } from '@nestjs/graphql'
import { UseGuards, UseInterceptors } from '@nestjs/common'
import { AppService } from '../../../services/business'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { GQLUser } from '../../decorators/user'
import { GQLUserGuard } from '../../guards/user'
import { IdToken } from '../../../services/base'

@Resolver()
@UseInterceptors(GQLLoggingInterceptor)
export class AppResolver {
  constructor(private readonly commService: AppService) {}

  @Query()
  @UseGuards(GQLUserGuard)
  async customToken(@GQLUser() user: IdToken): Promise<string> {
    return this.commService.customToken(user)
  }
}
