import '@/example/quasar'
import { initConfig } from '@/example/config'
import { initI18n } from '@/example/i18n'
import { initLogic } from '@/example/logic'
import { initStore } from '@/example/logic/store'
import { initTestAPI } from '../../mocks/common/logic/api'

export async function initExampleTest(): Promise<void> {
  initConfig()
  initTestAPI()
  initStore()
  initLogic()
  await initI18n()
}
