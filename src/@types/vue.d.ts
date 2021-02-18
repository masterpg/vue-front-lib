import 'vue'

/**
 * グローバルで共有したい変数をVueインスタンスに設定する方法を以下に示します。
 *
 * 1. Vueインスタンスにグローバル変数を設定する。
 *
 * @example
 * const services: ServiceContainer = new ServiceContainerImpl()
 *
 * Object.defineProperty(Vue.prototype, '$services', {
 *    value: services,
 *    writable: false,
 *    configurable: true,
 *  })
 *
 * 2. Vueインスタンスに設定した変数の型を設定する
 *
 * @example
 * import { ServiceContainer } from '@/services'
 *
 * declare module 'vue/types/vue' {
 *   interface Vue {
 *     $services: ServiceContainer
 *   }
 * }
 */
declare module 'vue/types/vue' {
  interface Vue {}
}
