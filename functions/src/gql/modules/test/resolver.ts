import { Args, Mutation, Resolver } from '@nestjs/graphql'
import { PutTestDataInput, TestServiceDI } from '../../../services/business'
import { Inject } from '@nestjs/common'

@Resolver()
export class TestResolver {
  constructor(@Inject(TestServiceDI.symbol) protected readonly testService: TestServiceDI.type) {}

  @Mutation()
  async putTestData(@Args('inputs') inputs: PutTestDataInput[]): Promise<boolean> {
    await this.testService.putTestData(inputs)
    return true
  }
}
