import { LibAPIContainer } from '@/lib'
import { initConfig } from '@/example/config'
import { initI18n } from '@/example/i18n'
import { initLibTestAPI } from '../../mocks/lib/logic/api'
import { initLibTestStore } from '../../mocks/lib/logic/store'
import { quasar } from '@/example/quasar'

//========================================================================
//
//  Implementation
//
//========================================================================

async function initLibTest(params: { api?: LibAPIContainer } = {}): Promise<void> {
  quasar.setup()
  initConfig()
  initLibTestAPI(params.api)
  initLibTestStore()
  await initI18n()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { initLibTest }
