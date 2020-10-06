import { TestAppAPIContainer } from '../../../mocks/example/logic/api'
import { config } from '@/example/config'
import { initExampleTest } from '../../../helpers/example/init'

//========================================================================
//
//  Test helpers
//
//========================================================================

let api!: TestAppAPIContainer

//========================================================================
//
//  Tests
//
//========================================================================

beforeAll(async () => {
  api = new TestAppAPIContainer()
  await initExampleTest({ api })
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
