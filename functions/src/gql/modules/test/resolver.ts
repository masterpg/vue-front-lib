import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PutTestDataInput, TestService } from '../../../services/business'
import { GQLLoggingInterceptor } from '../../interceptors/logging'
import { UseInterceptors } from '@nestjs/common'

@Resolver()
@UseInterceptors(GQLLoggingInterceptor)
export class TestResolver {
  constructor(private readonly testService: TestService) {}

  @Mutation()
  async putTestData(@Args('inputs') inputs: PutTestDataInput[]): Promise<boolean> {
    await this.testService.putTestData(inputs)
    return true
  }
}
