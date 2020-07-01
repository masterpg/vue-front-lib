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

describe('config', () => {
  it('サーバーとフロントの設定値が一致することを検証', async () => {
    const appConfig = await api.getAppConfig()
    expect(config.storage.usersDir).toBe(appConfig.usersDir)
    expect(config.storage.siteDir).toBe(appConfig.siteDir)
  })
})
