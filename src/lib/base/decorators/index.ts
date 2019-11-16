import Vue, { ComponentOptions, ComputedOptions } from 'vue'
import { createDecorator } from 'vue-class-component'

//========================================================================
//
//  Exports
//
//========================================================================

/**
 * 算出プロパティがキャッシュしないようにするためのデコレーターです。
 */
export const NoCache = createDecorator((options: ComponentOptions<Vue>, key: string) => {
  if (options.computed) {
    const computedDefinition = options.computed[key] as ComputedOptions<any>
    computedDefinition.cache = false
  }
})
