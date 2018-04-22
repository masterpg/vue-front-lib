import Vue from 'vue';
import { appStore, AppStore } from '../store';

let appVue: AppVue;

/**
 * アプリケーションにおけるVueのルートインスタンスの型です。。
 */
interface AppVue extends Vue {
  store: AppStore;
}

/**
 * Vueコンポーネントの初期化を行ないます。
 * @param app
 */
function initVueComponent(app: Vue) {
  appVue = app as AppVue;
  // Vueのルートインスタンスに`store`というプロパティを設定
  Object.defineProperty(appVue, 'store', {
    value: appStore,
    writable: false,
  });
}

/**
 * Vueコンポーネントの基底クラスです。
 */
class VueComponent extends Vue {
  /**
   * アプリケーションにおけるVueのルートインスタンスです。
   */
  get $app(): AppVue {
    return appVue;
  }
}

/**
 * Vueコンポーネントの基底クラスのMixinです。
 * @param superclass
 */
const VueComponentMixin = <T extends new (...args: any[]) => {}>(superclass: T) => class extends superclass {
  constructor(...args: any[]) {
    super(args);
  }

  /**
   * アプリケーションにおけるVueのルートインスタンスです。
   */
  get $app(): AppVue {
    return appVue;
  }
};

export { initVueComponent, VueComponent, VueComponentMixin };
