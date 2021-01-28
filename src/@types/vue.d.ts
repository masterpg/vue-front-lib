import 'vue'

/**
 * グローバルで共有したい変数をVueインスタンスに設定する方法を以下に示します。
 *
 * 1. Vueインスタンスにグローバル変数を設定する。
 *
 * @example
 * const service: ServiceContainer = new ServiceContainerImpl()
 *
 * Object.defineProperty(Vue.prototype, '$service', {
 *    value: service,
 *    writable: false,
 *    configurable: true,
 *  })
 *
 * 2. Vueインスタンスに設定した変数の型を設定する
 *
 * @example
 * import { ServiceContainer } from '@/service'
 *
 * declare module 'vue/types/vue' {
 *   interface Vue {
 *     $service: ServiceContainer
 *   }
 * }
 */
declare module 'vue/types/vue' {
  interface Vue {}
}
