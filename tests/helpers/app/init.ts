import { initLogic, initStore } from '@/app/logic'
import { AppAPIContainer } from '@/app/logic/api/base'
import { MockLogicContainer } from '../../mocks/app/logic'
import { initConfig } from '@/app/config'
import { initI18n } from '@/app/i18n'
import { initRouter } from '@/app/router'
import { initTestAPI } from '../../mocks/app/logic/api'
import { quasar } from '@/app/quasar'

//========================================================================
//
//  Implementation
//
//========================================================================

async function initTestApp(params: { api?: AppAPIContainer } = {}): Promise<void> {
  quasar.setup()
  initConfig()
  initRouter()
  initTestAPI(params.api)
  initStore()
  initLogic(new MockLogicContainer())
  await initI18n()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { initTestApp }
