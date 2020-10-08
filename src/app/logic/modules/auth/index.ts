import { ComputedRef } from '@vue/composition-api'
import { DeepReadonly } from 'web-base-lib'
import { TestData } from '@/app/logic/test-data'
import { User } from '@/app/logic/types'
import { injectInternalLogic } from '@/app/logic/modules/internal'
import { injectStore } from '@/app/logic/store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AuthLogic {
  readonly user: DeepReadonly<User>

  readonly isSignedIn: ComputedRef<boolean>

  signIn(): Promise<void>

  signOut(): Promise<void>

  validateSignedIn(): void
}

//========================================================================
//
//  Implementation
//
//========================================================================

function createAuthLogic(): AuthLogic {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const internal = injectInternalLogic()
  const store = injectStore()

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const signIn: AuthLogic['signIn'] = async () => {
    store.user.set(TestData.user)
    internal.auth.isSignedIn.value = true

    // TODO
    //  ここでローカルストレージに保存したIDトークンはAPIリクエストで使用されます。
    //  ただしここで設定した値は非常に擬似的なものであり、実装にはアプリケーションの仕様
    //  に基づき認証処理を実装してください。
    localStorage.setItem('idToken', JSON.stringify({ uid: store.user.value.id }))
  }

  const signOut: AuthLogic['signOut'] = async () => {
    store.user.clear()
    internal.auth.isSignedIn.value = false
  }

  const validateSignedIn = internal.auth.validateSignedIn

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    user: store.user.value,
    isSignedIn: internal.auth.isSignedIn,
    signIn,
    signOut,
    validateSignedIn,
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { AuthLogic, createAuthLogic }
