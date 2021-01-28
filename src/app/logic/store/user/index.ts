import 'firebase/auth'
import { DeepPartial, DeepReadonly } from 'web-base-lib'
import { User, UserClaims } from '@/app/logic/base'
import dayjs from 'dayjs'
import firebase from 'firebase/app'
import { reactive } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface UserStore {
  value: DeepReadonly<User>
  set(user: DeepPartial<User>): DeepReadonly<User>
  clear(): void
  reflectCustomToken(): Promise<void>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace UserStore {
  export function newInstance(): UserStore {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const state = reactive({
      value: createEmptyUser(),
    })

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const set: UserStore['set'] = user => {
      return User.populate(user, state.value)
    }

    const clear: UserStore['clear'] = () => {
      set(createEmptyUser())
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

  export function createEmptyUser(): User {
    return {
      id: '',
      email: '',
      emailVerified: false,
      userName: '',
      fullName: '',
      isAppAdmin: false,
      photoURL: '',
      version: 0,
      createdAt: dayjs(0),
      updatedAt: dayjs(0),
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { UserStore }
