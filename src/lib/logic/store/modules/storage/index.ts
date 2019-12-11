import { AppStorageStore, UserStorageStore } from '@/lib/logic/store/types'
import { BaseStorageStore } from '@/lib/logic/store/modules/storage/base'
import { Component } from 'vue-property-decorator'

@Component
export class UserStorageStoreImpl extends BaseStorageStore implements UserStorageStore {}

@Component
export class AppStorageStoreImpl extends BaseStorageStore implements AppStorageStore {}
