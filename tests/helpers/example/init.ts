import '@/example/quasar'
import { AppAPIContainer } from '@/example/logic/api'
import { initConfig } from '@/example/config'
import { initExampleTestAPI } from '../../mocks/example/logic/api'
import { initI18n } from '@/example/i18n'
import { initLogic } from '@/example/logic'
import { initStore } from '@/example/logic/store'

export async function initExampleTest(params: { api?: AppAPIContainer } = {}): Promise<void> {
  initConfig()
  initExampleTestAPI(params.api)
  initStore()
  initLogic()
  await initI18n()
}
