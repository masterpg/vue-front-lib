import { Module } from '@nestjs/common'
import { TestResolver } from './resolver'
import { TestService } from '../../../services/business'

@Module({
  providers: [TestService, TestResolver],
})
export class GQLTestModule {}
