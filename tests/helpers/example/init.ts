import '@/example/quasar'
import { initLogic, initStore } from '@/example/logic'
import { AppAPIContainer } from '../../../src/example/logic/api/base'
import { MockLogicContainer } from '../../mocks/example/logic'
import { initConfig } from '@/example/config'
import { initExampleTestAPI } from '../../mocks/example/logic/api'
import { initI18n } from '@/example/i18n'
import { initRouter } from '@/example/router'

//========================================================================
//
//  Implementation
//
//========================================================================

async function initExampleTest(params: { api?: AppAPIContainer } = {}): Promise<void> {
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
