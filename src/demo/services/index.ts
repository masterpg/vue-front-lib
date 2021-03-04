import { DemoAPIContainer, useAPI } from '@/demo/services/apis'
import { DemoStoreContainer, useStore } from '@/demo/services/stores'
import { HelperContainer, useHelper } from '@/app/services/helpers'
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

  export function newRawInstance(options?: { apis?: DemoAPIContainer; stores?: DemoStoreContainer; helpers?: HelperContainer }) {
    const apis = useAPI(options?.apis)
    const stores = useStore(options?.stores)
    const helpers = useHelper(options?.helpers)
    const dependency = { apis, stores, helpers }

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
