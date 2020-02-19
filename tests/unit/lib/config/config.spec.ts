import { TestLibAPIContainer } from '../../../mocks/lib/logic/api'
import { config } from '@/lib/config'
import { initLibTest } from '../../../helpers/lib/init'

//========================================================================
//
//  Test helpers
//
//========================================================================

let api!: TestLibAPIContainer

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = new TestLibAPIContainer()
  await initLibTest({ api })
})

describe('LibConfig', () => {
  describe('サーバーとフロントの設定値が一致することを検証', () => {
    it('storage.usersStorageDir', async () => {
      const serverAppConfig = await api.getAppConfig()
      expect(config.storage.usersDir).toBe(serverAppConfig.usersDir)
    })
  })
})
