import Vue from 'vue';

export interface Config {
  apiInfo: {
    protocol: string;
    host: string;
    port: number;
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

class DevConfig implements Config {
  readonly apiInfo = {
    protocol: '',
    host: '',
    port: 0,
  };
}

class StagingConfig implements Config {
  readonly apiInfo = {
    protocol: '',
    host: '',
    port: 0,
  };
}

class ProdConfig implements Config {
  readonly apiInfo = {
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
