import { BaseConfig, setConfig } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class MockAppConfig extends BaseConfig {
  constructor() {
    super()
  }
}

let config: MockAppConfig

function initLibTestConfig(): void {
  config = new MockAppConfig()
  setConfig(config)
}

//========================================================================
//
//  Implementation
//
//========================================================================

export { config, initLibTestConfig }
