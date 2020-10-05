import '../../mocks/lib/quasar'
import { LibAPIContainer } from '@/lib'
import { initConfig } from '@/example/config'
import { initLibTestAPI } from '../../mocks/lib/logic/api'
import { initLibTestI18n } from '../../mocks/lib/i18n'
import { initLibTestStore } from '../../mocks/lib/logic/store'

//========================================================================
//
//  Implementation
//
//========================================================================

async function initLibTest(params: { api?: LibAPIContainer } = {}): Promise<void> {
  initConfig()
  initLibTestAPI(params.api)
  initLibTestStore()
  await initLibTestI18n()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { initLibTest }
