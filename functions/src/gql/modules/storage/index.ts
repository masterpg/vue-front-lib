import { Module } from '@nestjs/common'
import { StorageResolver } from './resolver'
import { StorageService } from '../../../services/business'

@Module({
  providers: [StorageService, StorageResolver],
})
export class GQLStorageModule {}
