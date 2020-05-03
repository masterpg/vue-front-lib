import { BaseSWManager, setSW } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

class AppSWManager extends BaseSWManager {}

let sw: AppSWManager

async function initSW(): Promise<void> {
  sw = new AppSWManager()
  setSW(sw)
}

//========================================================================
//
//  Exports
//
//========================================================================

export { sw, initSW }
