import 'vue'

/**
 * グローバルで共有したい変数をVueインスタンスに設定する方法を以下に示します。
 *
 * 1. Vueインスタンスにグローバル変数を設定する。
 *
 * @example
 * const logic: LogicContainer = new LogicContainerImpl()
 *
 * Object.defineProperty(Vue.prototype, '$logic', {
 *    value: logic,
 *    writable: false,
 *    configurable: true,
 *  })
 *
 * 2. Vueインスタンスに設定した変数の型を設定する
 *
 * @example
 * import { LogicContainer } from '@/logic'
 *
 * declare module 'vue/types/vue' {
 *   interface Vue {
 *     $logic: LogicContainer
 *   }
 * }
 */
declare module 'vue/types/vue' {
  interface Vue {}
}
