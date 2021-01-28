import { ServiceContainer, injectService as _injectService, provideService as _provideService } from '@/app/service'
import { DemoAPIContainer } from '@/demo/service/api'
import { DemoStoreContainer } from '@/demo/service/store'
import { InternalService } from '@/app/service/modules/internal'
import { ShopService } from '@/demo/service/modules/shop'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface DemoServiceContainer extends ServiceContainer {
  readonly shop: ShopService
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace DemoServiceContainer {
  export function newInstance(): DemoServiceContainer {
    return newRawInstance()
  }

  export function newRawInstance(options?: { api?: DemoAPIContainer; store?: DemoStoreContainer; internal?: InternalService }) {
    const api = options?.api ?? DemoAPIContainer.newInstance()
    const store = options?.store ?? DemoStoreContainer.newInstance()
    const internal = options?.internal ?? InternalService.newInstance()
    const dependency = { api, store, internal }

    const base = ServiceContainer.newRawInstance(dependency)

    return {
      ...base,
      shop: ShopService.newRawInstance(),
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

function provideService(instance?: DemoServiceContainer): void {
  instance = instance ?? DemoServiceContainer.newInstance()
  _provideService(instance)
}

function injectService(): DemoServiceContainer {
  return _injectService() as DemoServiceContainer
}

//========================================================================
//
//  Export
//
//========================================================================

export { DemoServiceContainer, injectService, provideService }
export * from '@/demo/service/base'
