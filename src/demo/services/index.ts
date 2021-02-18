import { ServiceContainer, injectService as _injectService, provideService as _provideService } from '@/app/services'
import { DemoAPIContainer } from '@/demo/services/apis'
import { DemoStoreContainer } from '@/demo/services/stores'
import { InternalService } from '@/app/services/modules/internal'
import { ShopService } from '@/demo/services/modules/shop'

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

  export function newRawInstance(options?: { apis?: DemoAPIContainer; stores?: DemoStoreContainer; internal?: InternalService }) {
    const apis = options?.apis ?? DemoAPIContainer.newInstance()
    const stores = options?.stores ?? DemoStoreContainer.newInstance()
    const internal = options?.internal ?? InternalService.newInstance()
    const dependency = { apis, stores, internal }

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
export * from '@/demo/services/base'
