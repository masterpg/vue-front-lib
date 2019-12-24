import '../../mocks/lib/quasar'
import { LibAPIContainer } from '@/lib'
import { initLibTestAPI } from '../../mocks/lib/logic/api'
import { initLibTestConfig } from '../../mocks/lib/config'
import { initLibTestI18n } from '../../mocks/lib/i18n'
import { initLibTestStore } from '../../mocks/lib/logic/store'

export async function initLibTest(params: { api?: LibAPIContainer } = {}): Promise<void> {
  initLibTestConfig()
  initLibTestAPI(params.api)
  initLibTestStore()
  await initLibTestI18n()
}
