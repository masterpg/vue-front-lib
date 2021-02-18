import { DemoAPIContainer, useAPI } from '@/demo/services/apis'
import { DemoStoreContainer, useStore } from '@/demo/services/stores'
import { InternalServiceContainer, useInternalService } from '@/app/services/modules/internal'
import { ServiceContainer } from '@/app/services'
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
  let instance: DemoServiceContainer

  export function useService(services?: DemoServiceContainer): DemoServiceContainer {
    instance = services ?? instance ?? newRawInstance()
    return instance
  }

  export function newRawInstance(options?: { apis?: DemoAPIContainer; stores?: DemoStoreContainer; internal?: InternalServiceContainer }) {
    const apis = useAPI(options?.apis)
    const stores = useStore(options?.stores)
    const internal = useInternalService(options?.internal)
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
//  Export
//
//========================================================================

const { useService } = DemoServiceContainer
export { DemoServiceContainer, useService }
export * from '@/demo/services/base'
