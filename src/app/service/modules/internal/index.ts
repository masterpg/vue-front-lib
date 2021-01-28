import { ComputedRef, WritableComputedRef, computed, reactive } from '@vue/composition-api'
import { AuthStatus } from '@/app/service'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface InternalService {
  helper: InternalHelperService
  auth: InternalAuthService
}

interface InternalHelperService {}

interface InternalAuthService {
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
//  InternalHelperService
//--------------------------------------------------

namespace InternalHelperService {
  export function newInstance(): InternalHelperService {
    return {}
  }
}

//--------------------------------------------------
//  InternalAuthService
//--------------------------------------------------

namespace InternalAuthService {
  export function newInstance(): InternalAuthService {
    const state = reactive({
      status: AuthStatus.None,
      isSignedIn: false,
    })

    const status = computed({
      get: () => state.status,
      set: value => (state.status = value),
    })

    const isSignedIn = computed(() => state.status === AuthStatus.Available)

    const validateSignedIn: InternalAuthService['validateSignedIn'] = () => {
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

namespace InternalService {
  export function newInstance(): InternalService {
    return newRawInstance()
  }

  export function newRawInstance(options?: { helper?: InternalHelperService; auth?: InternalAuthService }) {
    const helper = options?.helper ?? InternalHelperService.newInstance()
    const auth = options?.auth ?? InternalAuthService.newInstance()

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

let instance: InternalService

function provideInternalService(internal: InternalService): void {
  instance = internal
}

function injectInternalService(): InternalService {
  if (!instance) {
    throw new Error(`'InternalService' is not provided`)
  }
  return instance
}

//========================================================================
//
//  Export
//
//========================================================================

export { InternalAuthService, InternalHelperService, InternalService, provideInternalService, injectInternalService }
