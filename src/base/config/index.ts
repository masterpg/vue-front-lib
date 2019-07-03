import Vue from 'vue'

export interface Config {
  api: {
    protocol: string
    host: string
    port: number
  }

  firebase: {
    apiKey: string
    authDomain: string
    databaseURL?: string
    projectId?: string
    storageBucket?: string
    messagingSenderId?: string
  }
}

class ConfigImpl implements Config {
  constructor() {
    firebase.initializeApp(this.firebase)
  }

  readonly api = {
    protocol: String(process.env.VUE_APP_API_PROTOCOL),
    host: String(process.env.VUE_APP_API_HOST),
    port: Number(process.env.VUE_APP_API_PORT),
  }

  readonly firebase = {
    apiKey: '<API_KEY>',
    authDomain: '<PROJECT_ID>.firebaseapp.com',
    databaseURL: 'https://<DATABASE_NAME>.firebaseio.com',
    projectId: '<PROJECT_ID>',
    storageBucket: '<BUCKET>.appspot.com',
    messagingSenderId: '<SENDER_ID>',
  }
}

export let config: Config

export function initConfig(): void {
  config = new ConfigImpl()
}
