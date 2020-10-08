import { DeepReadonly } from 'web-base-lib'
import { StoreUtil } from '@/logic/store/base'
import { User } from '@/logic/types'
import dayjs from 'dayjs'
import { reactive } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface UserStore {
  value: DeepReadonly<User>
  set(user: User): DeepReadonly<User>
  clear(): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createEmptyState(): User {
  return {
    id: '',
    email: '',
    displayName: '',
    createdAt: dayjs(0),
    updatedAt: dayjs(0),
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
    return StoreUtil.populateUser(user, state.value)
  }

  const clear: UserStore['clear'] = () => {
    set(createEmptyState())
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
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { UserStore, createUserStore }
