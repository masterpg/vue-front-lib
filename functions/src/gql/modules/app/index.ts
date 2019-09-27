import { AppResolver } from './resolver'
import { AppService } from '../../../services/business'
import { Module } from '@nestjs/common'

@Module({
  providers: [AppService, AppResolver],
})
export class GQLAppModule {}
