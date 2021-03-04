import { AuthStatus, SignInStatus } from '@/app/services'
import { ComputedRef, computed, ref } from '@vue/composition-api'
import { Unsubscribe, createNanoEvents } from 'nanoevents'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AuthHelper {
  authStatus: ComputedRef<AuthStatus>
  signInStatus: ComputedRef<SignInStatus>
  isSignedIn: ComputedRef<boolean>
  isSigningIn: ComputedRef<boolean>
  isNotSignedIn: ComputedRef<boolean>
  changeStatus(status: AuthStatus | 'SigningIn'): void
  validateSignedIn(): void
  /**
   * サインイン状態変更の監視を行います。
   * 通常は`watch`を使用し、`watch`がうまく動作しない場合はこのメソッドの使用を検討してください。
   * @param cb
   */
  watchSignInStatus: (cb: (newValue: SignInStatus, oldValue?: SignInStatus) => any) => Unsubscribe
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace AuthHelper {
  export function newInstance(): AuthHelper {
    const emitter = createNanoEvents()

    const authStatus = ref<AuthStatus>('None')

    const signInStatus = ref<SignInStatus>('None')

    const isSignedIn = computed(() => signInStatus.value === 'SignedIn')

    const isSigningIn = computed(() => signInStatus.value === 'SigningIn')

    const isNotSignedIn = computed(() => signInStatus.value === 'None')

    const changeStatus: AuthHelper['changeStatus'] = status => {
      let newAuthStatus: AuthStatus
      let newSignInStatus: SignInStatus
      switch (status) {
        case 'None':
          newAuthStatus = 'None'
          newSignInStatus = 'None'
          break
        case 'SigningIn':
          newAuthStatus = 'None'
          newSignInStatus = 'SigningIn'
          break
        case 'WaitForEmailVerified':
        case 'WaitForEntry':
          newAuthStatus = status
          newSignInStatus = 'SigningIn'
          break
        case 'Available':
          newAuthStatus = 'Available'
          newSignInStatus = 'SignedIn'
          break
      }

      if (authStatus.value !== newAuthStatus) {
        authStatus.value = newAuthStatus
      }
      if (signInStatus.value !== newSignInStatus) {
        const oldSignInStatus = signInStatus.value
        signInStatus.value = newSignInStatus
        emitter.emit('signInStatusChange', newSignInStatus, oldSignInStatus)
      }
    }

    const validateSignedIn: AuthHelper['validateSignedIn'] = () => {
      if (signInStatus.value !== 'SignedIn') {
        throw new Error(`The application is not yet signed in.`)
      }
    }

    const watchSignInStatus: AuthHelper['watchSignInStatus'] = cb => {
      return emitter.on('signInStatusChange', cb)
    }

    return {
      authStatus,
      signInStatus,
      isSignedIn,
      isSigningIn,
      isNotSignedIn,
      changeStatus,
      validateSignedIn,
      watchSignInStatus,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { AuthHelper }
