import { ComputedRef, WritableComputedRef, computed, reactive } from '@vue/composition-api'
import { AuthStatus } from '@/app/logic'

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

//========================================================================
//
//  Implementation
//
//========================================================================

//--------------------------------------------------
//  InternalHelperLogic
//--------------------------------------------------

namespace InternalHelperLogic {
  export function newInstance(): InternalHelperLogic {
    return {}
  }
}

//--------------------------------------------------
//  InternalAuthLogic
//--------------------------------------------------

namespace InternalAuthLogic {
  export function newInstance(): InternalAuthLogic {
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
  export function newInstance(): InternalLogic {
    return newRawInstance()
  }

  export function newRawInstance(options?: { helper?: InternalHelperLogic; auth?: InternalAuthLogic }) {
    const helper = options?.helper ?? InternalHelperLogic.newInstance()
    const auth = options?.auth ?? InternalAuthLogic.newInstance()

    return {
      helper,
      auth,
    }
  }
}

//========================================================================
//
//  Dependency Injection
//
//========================================================================

let instance: InternalLogic

function provideInternalLogic(internal: InternalLogic): void {
  instance = internal
}

function injectInternalLogic(): InternalLogic {
  if (!instance) {
    throw new Error(`'InternalLogic' is not provided`)
  }
  return instance
}

//========================================================================
//
//  Export
//
//========================================================================

export { InternalAuthLogic, InternalHelperLogic, InternalLogic, provideInternalLogic, injectInternalLogic }
