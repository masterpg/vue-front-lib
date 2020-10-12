import { InjectionKey, WritableComputedRef, computed, inject, provide, reactive } from '@vue/composition-api'
import { AuthStatus } from '@/app/logic'
import { injectStore } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface InternalLogic {
  helper: {}
  auth: {
    status: WritableComputedRef<AuthStatus>
    isSignedIn: WritableComputedRef<boolean>
    validateSignedIn(): void
  }
}

type InternalHelperLogic = InternalLogic['helper']

type InternalAuthLogic = InternalLogic['auth']

//========================================================================
//
//  Implementation
//
//========================================================================

//--------------------------------------------------
//  InternalHelperLogic
//--------------------------------------------------

function createInternalHelperLogic(): InternalHelperLogic {
  return {}
}

//--------------------------------------------------
//  InternalAuthLogic
//--------------------------------------------------

function createInternalAuthLogic(): InternalAuthLogic {
  const store = injectStore()

  const state = reactive({
    status: AuthStatus.None,
    isSignedIn: false,
  })

  const status = computed({
    get: () => state.status,
    set: value => (state.status = value),
  })

  const isSignedIn = computed({
    get: () => state.isSignedIn,
    set: value => (state.isSignedIn = value),
  })

  const validateSignedIn: InternalAuthLogic['validateSignedIn'] = () => {
    if (!state.isSignedIn) {
      throw new Error(`The application is not yet signed in.`)
    }
  }

  return {
    status,
    isSignedIn,
    validateSignedIn,
  }
}

//--------------------------------------------------
//  Others
//--------------------------------------------------

const InternalLogicKey: InjectionKey<InternalLogic> = Symbol('InternalLogic')

function createInternalLogic(): InternalLogic {
  return {
    helper: createInternalHelperLogic(),
    auth: createInternalAuthLogic(),
  }
}

function provideInternalLogic(internal?: InternalLogic | typeof createInternalLogic): void {
  let instance: InternalLogic
  if (!internal) {
    instance = createInternalLogic()
  } else {
    instance = typeof internal === 'function' ? internal() : internal
  }
  provide(InternalLogicKey, instance)
}

function injectInternalLogic(): InternalLogic {
  validateInternalLogicProvided()
  return inject(InternalLogicKey)!
}

function validateInternalLogicProvided(): void {
  if (!inject(InternalLogicKey)) {
    throw new Error(`${InternalLogicKey.description} is not provided`)
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export {
  InternalAuthLogic,
  InternalHelperLogic,
  InternalLogic,
  InternalLogicKey,
  createInternalAuthLogic,
  createInternalHelperLogic,
  createInternalLogic,
  injectInternalLogic,
  provideInternalLogic,
  validateInternalLogicProvided,
}
