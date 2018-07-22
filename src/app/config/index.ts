import Vue from 'vue';

export abstract class Config {
  constructor() {
    firebase.initializeApp(this.firebase);
  }

  api: { protocol: string; host: string; port: number } = {
    protocol: '',
    host: '',
    port: 0,
  };

  firebase: {
    apiKey: string;
    authDomain: string;
    databaseURL?: string;
    projectId?: string;
    storageBucket?: string;
    messagingSenderId?: string;
  } = {
    apiKey: '<API_KEY>',
    authDomain: '<PROJECT_ID>.firebaseapp.com',
    databaseURL: 'https://<DATABASE_NAME>.firebaseio.com',
    projectId: '<PROJECT_ID>',
    storageBucket: '<BUCKET>.appspot.com',
    messagingSenderId: '<SENDER_ID>',
  };
}

function newConfig(): Config {
  switch (process.env.TARGET_ENV) {
    case 'development':
      return new DevConfig();
    case 'staging':
      return new StagingConfig();
    case 'production':
      return new ProdConfig();
    default:
      throw new Error('The value set for process.env.TARGET_ENV is illegal.');
  }
}

class DevConfig extends Config {}

class StagingConfig extends Config {}

class ProdConfig extends Config {
  readonly api = {
    protocol: 'https',
    host: 'mydomain.net',
    port: 80,
  };
}

export function init(): void {
  Object.defineProperty(Vue.prototype, '$config', {
    value: newConfig(),
    writable: false,
  });
}
