import { BaseConfig, setConfig } from '@/lib'
import firebaseConfig from '../../../firebase.config'

//========================================================================
//
//  Exports
//
//========================================================================

export class AppConfig extends BaseConfig {}

export let config: AppConfig

export function initConfig(value?: AppConfig): void {
  if (value) {
    config = value
  } else {
    config = new AppConfig(firebaseConfig, {
      protocol: String(process.env.VUE_APP_API_PROTOCOL),
      host: String(process.env.VUE_APP_API_HOST),
      port: Number(process.env.VUE_APP_API_PORT),
      basePath: String(process.env.VUE_APP_API_BASE_PATH),
    })
  }
  setConfig(config)
}
