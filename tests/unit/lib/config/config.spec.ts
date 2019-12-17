import { api } from '../../../mocks/common/logic/api'
import { config } from '@/lib/config'
import { initLibTest } from '../../../helpers/lib/init'

beforeAll(async () => {
  await initLibTest()
})

describe('LibConfig', () => {
  describe('サーバーとフロントの設定値が一致することを検証', () => {
    it('storage.usersStorageDir', async () => {
      const serverAppConfig = await api.appConfig()
      expect(config.storage.usersDir).toBe(serverAppConfig.usersDir)
    })
  })
})
