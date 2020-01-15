import '@/example/quasar'
import { AppAPIContainer } from '@/example/logic/api'
import { MockLogicContainer } from '../../mocks/example/logic'
import { initConfig } from '@/example/config'
import { initExampleTestAPI } from '../../mocks/example/logic/api'
import { initI18n } from '@/example/i18n'
import { initLogic } from '@/example/logic'
import { initRouter } from '@/example/router'
import { initStore } from '@/example/logic/store'

export async function initExampleTest(params: { api?: AppAPIContainer } = {}): Promise<void> {
  initConfig()
  initRouter()
  initExampleTestAPI(params.api)
  initStore()
  initLogic(new MockLogicContainer())
  await initI18n()
}
