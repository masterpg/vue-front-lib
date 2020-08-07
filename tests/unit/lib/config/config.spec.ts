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
    expect(config.storage.users.dir).toBe(appConfig.users.dir)
    expect(config.storage.articles.dir).toBe(appConfig.articles.dir)
    expect(config.storage.articles.assetsDir).toBe(appConfig.articles.assetsDir)
    expect(config.storage.articles.fileName).toBe(appConfig.articles.fileName)
  })
})
