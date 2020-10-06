import { initLogic, initStore } from '@/example/logic'
import { AppAPIContainer } from '@/example/logic/api/base'
import { MockLogicContainer } from '../../mocks/example/logic'
import { initConfig } from '@/example/config'
import { initExampleTestAPI } from '../../mocks/example/logic/api'
import { initI18n } from '@/example/i18n'
import { initRouter } from '@/example/router'
import { quasar } from '@/example/quasar'

//========================================================================
//
//  Implementation
//
//========================================================================

async function initExampleTest(params: { api?: AppAPIContainer } = {}): Promise<void> {
  quasar.setup()
  initConfig()
  initRouter()
  initExampleTestAPI(params.api)
  initStore()
  initLogic(new MockLogicContainer())
  await initI18n()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { initExampleTest }
