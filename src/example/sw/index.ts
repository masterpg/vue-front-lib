import { BaseSWManager, setSW } from '@/lib'

//========================================================================
//
//  Internal
//
//========================================================================

class AppSWManager extends BaseSWManager {}

//========================================================================
//
//  Exports
//
//========================================================================

export let sw: AppSWManager

export async function initSW(): Promise<void> {
  sw = new AppSWManager()
  setSW(sw)
}
