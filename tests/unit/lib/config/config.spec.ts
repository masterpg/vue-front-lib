import { api, initAPI } from '../../../mocks/logic/api'
import { config } from '@/lib/config'

jest.setTimeout(25000)
initAPI()

describe('LibConfig', () => {
  describe('サーバーとフロントの設定値が一致することを検証', () => {
    it('storage.usersStorageDir', async () => {
      const serverAppConfig = await api.appConfig()
      expect(config.storage.usersDir).toBe(serverAppConfig.usersDir)
    })
  })
})
