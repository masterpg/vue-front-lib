import '../../mocks/lib/quasar'
import { initLibTestConfig } from '../../mocks/lib/config'
import { initLibTestI18n } from '../../mocks/lib/i18n'
import { initLibTestStore } from '../../mocks/lib/logic/store'
import { initTestAPI } from '../../mocks/common/logic/api'

export async function initLibTest(): Promise<void> {
  initLibTestConfig()
  initTestAPI()
  initLibTestStore()
  await initLibTestI18n()
}
