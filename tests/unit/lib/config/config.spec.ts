import { TestLibAPIContainer } from '../../../mocks/lib/logic/api'
import { config } from '@/example/config'
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
    expect(config.storage.user.rootName).toBe(appConfig.user.rootName)
    expect(config.storage.article.rootName).toBe(appConfig.article.rootName)
    expect(config.storage.article.fileName).toBe(appConfig.article.fileName)
    expect(config.storage.article.assetsName).toBe(appConfig.article.assetsName)
  })
})
