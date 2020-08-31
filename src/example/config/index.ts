import { BaseConfig, setConfig } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class AppConfig extends BaseConfig {
  constructor() {
    super()
  }
}

let config: AppConfig

function initConfig(value?: AppConfig): void {
  config = value || new AppConfig()
  setConfig(config)
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AppConfig, config, initConfig }
