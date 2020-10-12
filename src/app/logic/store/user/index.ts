import { DeepPartial, DeepReadonly } from 'web-base-lib'
import { UserClaims, UserInfo } from '@/app/logic/base'
import dayjs from 'dayjs'
import { reactive } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface UserStore {
  value: DeepReadonly<UserInfo>
  set(user: DeepPartial<UserInfo>): DeepReadonly<UserInfo>
  clear(): void
  reflectCustomToken(): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createEmptyState(): UserInfo {
  return {
    id: '',
    email: '',
    emailVerified: false,
    isAppAdmin: false,
    createdAt: dayjs(0),
    updatedAt: dayjs(0),
    publicProfile: {
      id: '',
      displayName: '',
      photoURL: '',
      createdAt: dayjs(0),
      updatedAt: dayjs(0),
    },
  }
}

function createUserStore(): UserStore {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const state = reactive({
    value: createEmptyState(),
  })

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const set: UserStore['set'] = user => {
    return UserInfo.populate(user, state.value)
  }

  const clear: UserStore['clear'] = () => {
    set(createEmptyState())
  }

  const reflectCustomToken: UserStore['reflectCustomToken'] = async () => {
    const idToken = await firebase.auth().currentUser!.getIdTokenResult()
    const { isAppAdmin } = idToken.claims as UserClaims
    set({ isAppAdmin })
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    value: state.value,
    set,
    clear,
    reflectCustomToken,
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { UserStore, createUserStore }
