import { Module } from '@nestjs/common'
import { TestResolver } from './resolver'

@Module({
  providers: [TestResolver],
})
export class GQLTestModule {}
