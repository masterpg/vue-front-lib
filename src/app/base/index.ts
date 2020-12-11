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

//========================================================================
//
//  Exports
//
//========================================================================

export { extendedMethod, isFontAwesome }
