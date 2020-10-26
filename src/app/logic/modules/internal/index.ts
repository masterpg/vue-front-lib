import { ComputedRef, WritableComputedRef, computed, reactive } from '@vue/composition-api'
import { APIContainer } from '@/app/logic/api'
import { AuthStatus } from '@/app/logic'
import { StoreContainer } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface InternalLogic {
  helper: InternalHelperLogic
  auth: InternalAuthLogic
}

interface InternalHelperLogic {}

interface InternalAuthLogic {
  status: WritableComputedRef<AuthStatus>
  isSignedIn: ComputedRef<boolean>
  validateSignedIn(): void
}

interface InternalLogicDependency {
  api: APIContainer
  store: StoreContainer
}

//========================================================================
//
//  Implementation
//
//========================================================================

//--------------------------------------------------
//  InternalHelperLogic
//--------------------------------------------------

namespace InternalHelperLogic {
  export function newInstance(dependency: InternalLogicDependency): InternalHelperLogic {
    return {}
  }
}

//--------------------------------------------------
//  InternalAuthLogic
//--------------------------------------------------

namespace InternalAuthLogic {
  export function newInstance(dependency: InternalLogicDependency): InternalAuthLogic {
    const state = reactive({
      status: AuthStatus.None,
      isSignedIn: false,
    })

    const status = computed({
      get: () => state.status,
      set: value => (state.status = value),
    })

    const isSignedIn = computed(() => state.status === AuthStatus.Available)

    const validateSignedIn: InternalAuthLogic['validateSignedIn'] = () => {
      if (!isSignedIn.value) {
        throw new Error(`The application is not yet signed in.`)
      }
    }

    return {
      status,
      isSignedIn,
      validateSignedIn,
    }
  }
}

namespace InternalLogic {
  export function newInstance(dependency: InternalLogicDependency): InternalLogic {
    return newRawInstance(dependency)
  }

  export function newRawInstance(dependency: InternalLogicDependency, options?: { helper?: InternalHelperLogic; auth?: InternalAuthLogic }) {
    const helper = options?.helper ?? InternalHelperLogic.newInstance(dependency)
    const auth = options?.auth ?? InternalAuthLogic.newInstance(dependency)

    return {
      helper,
      auth,
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { InternalAuthLogic, InternalHelperLogic, InternalLogic }
