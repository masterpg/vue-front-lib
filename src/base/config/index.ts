export interface Config {
  api: {
    protocol: string
    host: string
    port: number
    baseURL: string
  }
}

class ConfigImpl implements Config {
  readonly api = {
    protocol: String(process.env.VUE_APP_API_PROTOCOL),
    host: String(process.env.VUE_APP_API_HOST),
    port: Number(process.env.VUE_APP_API_PORT),
    baseURL: String(process.env.VUE_APP_API_BASE_URL),
  }
}

export let config: Config

export function initConfig(): void {
  config = new ConfigImpl()
}
