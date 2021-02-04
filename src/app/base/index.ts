import { computed, reactive } from '@vue/composition-api'
import { Screen } from 'quasar'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ScreenSize {
  readonly name: 'sp' | 'tb' | 'pc'
  readonly sp: boolean
  readonly tb: boolean
  readonly pc: boolean
  readonly lt: { tb: boolean; pc: boolean }
  readonly gt: { sp: boolean; tb: boolean }
}

//========================================================================
//
//  Implementation
//
//========================================================================

function extendedMethod<T extends Function>(method: T): T & { readonly super: T; value: T } {
  const _super = method
  let _value = method
  const result: any = (...args: any[]) => {
    return _value(...args)
  }

  Object.defineProperty(result, 'super', {
    get: () => _super,
  })

  Object.defineProperty(result, 'value', {
    get: () => _value,
    set: v => (_value = v),
  })

  return result
}

/**
 * 指定されたアイコンがFontAwesomeか否かを取得します。
 * @param icon
 */
function isFontAwesome(icon: string | undefined | null): boolean {
  if (!icon) return false
  return Boolean(icon.match(/fa[sbr] fa-/))
}

namespace ScreenSize {
  let instance: ScreenSize

  export function getInstance(): ScreenSize {
    instance = instance ?? newInstance()
    return instance
  }

  export function newInstance(): ScreenSize {
    const name = computed<ScreenSize['name']>(() => (sp.value ? 'sp' : tb.value ? 'tb' : 'pc'))
    const sp = computed<ScreenSize['sp']>(() => Screen.lt.md)
    const tb = computed<ScreenSize['tb']>(() => Screen.name === 'md')
    const pc = computed<ScreenSize['pc']>(() => Screen.gt.md)
    const lt = computed<ScreenSize['lt']>(() => {
      return {
        tb: Screen.lt.md,
        pc: Screen.lt.xl,
      }
    })
    const gt = computed<ScreenSize['gt']>(() => {
      return {
        sp: Screen.gt.sm,
        tb: Screen.gt.md,
      }
    })
    return reactive({ name, sp, tb, pc, lt, gt })
  }
}

function useScreenSize(): ScreenSize {
  return ScreenSize.getInstance()
}

//========================================================================
//
//  Exports
//
//========================================================================

export { extendedMethod, isFontAwesome, useScreenSize }
