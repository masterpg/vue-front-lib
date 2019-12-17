import { AppConfig, initConfig } from '@/example/config'

class MockAppConfig extends AppConfig {
  constructor() {
    super()
    this.setAPI({
      protocol: String(process.env.VUE_APP_API_PROTOCOL),
      host: String(process.env.VUE_APP_API_HOST),
      port: Number(process.env.VUE_APP_API_PORT),
      basePath: String(process.env.VUE_APP_API_BASE_PATH),
    })
  }
}

export let config: MockAppConfig

export function initLibTestConfig(): void {
  config = new MockAppConfig()
  initConfig(config)
}
