import {APIs} from '@/apis'
import {AppStore} from '@/store'

declare interface TestModule<S> {
  $apis: APIs
  $appStore: AppStore
}
