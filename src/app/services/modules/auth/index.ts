import 'firebase/auth'
import { AuthHelper, useHelper } from '@/app/services/helpers'
import { AuthStatus, SignInStatus, User, UserInput } from '@/app/services/base'
import { ComputedRef } from '@vue/composition-api'
import { DeepReadonly } from 'web-base-lib'
import { Dialog } from 'quasar'
import { extendedMethod } from '@/app/base'
import firebase from 'firebase/app'
import { useAPI } from '@/app/services/apis'
import { useI18n } from '@/app/i18n'
import { useStore } from '@/app/services/stores'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AuthService {
  readonly user: DeepReadonly<User>

  readonly authStatus: ComputedRef<AuthStatus>

  readonly signInStatus: ComputedRef<SignInStatus>

  readonly isSignedIn: ComputedRef<boolean>

  readonly isSigningIn: ComputedRef<boolean>

  readonly isNotSignedIn: ComputedRef<boolean>

  checkSingedIn(): Promise<void>

  signInWithGoogle(): Promise<void>

  signInWithFacebook(): Promise<void>

  signInWithEmailAndPassword(email: string, password: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  signInAnonymously(): Promise<{ result: boolean; code: string; errorMessage: string }>

  sendEmailVerification(continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  sendPasswordResetEmail(email: string, continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  createUserWithEmailAndPassword(
    email: string,
    password: string,
    profile: { photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }>

  signOut(): Promise<void>

  deleteUser(): Promise<{ result: boolean; code: string; errorMessage: string }>

  updateEmail(newEmail: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]>

  setUserInfo(input: UserInput): Promise<{ result: boolean; code: string; errorMessage: string }>

  validateSignedIn: AuthHelper['validateSignedIn']

  watchSignInStatus: AuthHelper['watchSignInStatus']
}

enum AuthProviderType {
  Google = 'google.com',
  Facebook = 'facebook.com',
  Password = 'password',
  Anonymous = 'anonymous',
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace AuthService {
  export function newInstance(): AuthService {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const apis = useAPI()
    const stores = useStore()
    const helpers = useHelper()
    const i18n = useI18n()

    const googleProvider = new firebase.auth.GoogleAuthProvider()
    googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly')

    const facebookProvider = new firebase.auth.FacebookAuthProvider()
    facebookProvider.addScope('user_birthday')

    // サインイン中に設定
    helpers.auth.changeStatus('SigningIn')

    //----------------------------------------------------------------------
    //
    //  Properties
    //
    //----------------------------------------------------------------------

    const authStatus = helpers.auth.authStatus

    const signInStatus = helpers.auth.signInStatus

    const isSignedIn = helpers.auth.isSignedIn

    const isSigningIn = helpers.auth.isSigningIn

    const isNotSignedIn = helpers.auth.isNotSignedIn

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const checkSingedIn: AuthService['checkSingedIn'] = async () => {
      // リダイレクト式によるサインインの認証情報を取得
      const redirected = await firebase.auth().getRedirectResult()

      if (redirected.credential) {
        // Googleのアクセストークンを取得
        // このトークンはGoogleAPIにアクセスする際に使用する
        const token = (redirected.credential as any).accessToken
      }
    }

    const signInWithGoogle: AuthService['signInWithGoogle'] = async () => {
      await firebase.auth().signInWithRedirect(googleProvider)
    }

    const signInWithFacebook: AuthService['signInWithFacebook'] = async () => {
      await firebase.auth().signInWithRedirect(facebookProvider)
    }

    const signInWithEmailAndPassword: AuthService['signInWithEmailAndPassword'] = async (email, password) => {
      try {
        await firebase.auth().signInWithEmailAndPassword(email, password)
      } catch (err) {
        console.error(err)
        let errorMessage: string | undefined
        if (err.code === 'auth/wrong-password') {
          errorMessage = String(i18n.t('auth.authFailedCode.wrongPassword'))
        } else if (err.code === 'auth/user-not-found') {
          errorMessage = String(i18n.t('auth.authFailedCode.userNotFound'))
        } else if (err.code === 'auth/too-many-requests') {
          errorMessage = String(i18n.t('auth.authFailedCode.tooManyRequests'))
        }
        return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
      }

      await refreshUser()

      return { result: true, code: '', errorMessage: '' }
    }

    const signInAnonymously: AuthService['signInAnonymously'] = async () => {
      try {
        await firebase.auth().signInAnonymously()
      } catch (err) {
        return { result: false, code: err.code || '', errorMessage: err.message || '' }
      }
      return { result: true, code: '', errorMessage: '' }
    }

    const createUserWithEmailAndPassword: AuthService['createUserWithEmailAndPassword'] = async (email, password, profile) => {
      try {
        // メールアドレス＋パスワードでアカウント作成
        await firebase.auth().createUserWithEmailAndPassword(email, password)
        // 作成されたアカウントに表示名を設定
        await firebase.auth().currentUser!.updateProfile(profile)
      } catch (err) {
        console.error(err)
        let errorMessage: string | undefined
        if (err.code === 'auth/email-already-in-use') {
          errorMessage = String(i18n.t('auth.authFailedCode.emailAlreadyInUse'))
        }
        return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
      }

      await refreshUser()

      return { result: true, code: '', errorMessage: '' }
    }

    const sendEmailVerification: AuthService['sendEmailVerification'] = async continueURL => {
      const user = firebase.auth().currentUser
      if (!user) {
        throw new Error('There is not user signed-in.')
      }

      firebase.auth().languageCode = 'ja'
      try {
        await firebase.auth().currentUser!.sendEmailVerification({
          url: continueURL,
          handleCodeInApp: false,
        })
      } catch (err) {
        console.error(err)
        let errorMessage: string | undefined
        if (err.code === 'auth/too-many-requests') {
          errorMessage = String(i18n.t('auth.authFailedCode.tooManyRequests'))
        }
        return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
      }

      return { result: true, code: '', errorMessage: '' }
    }

    const sendPasswordResetEmail: AuthService['sendPasswordResetEmail'] = async (email, continueURL) => {
      try {
        firebase.auth().languageCode = 'ja'
        await firebase.auth().sendPasswordResetEmail(email, {
          url: continueURL,
          handleCodeInApp: false,
        })
      } catch (err) {
        return { result: false, code: err.code || '', errorMessage: err.message || '' }
      }

      return { result: true, code: '', errorMessage: '' }
    }

    const signOut: AuthService['signOut'] = async () => {
      await firebase.auth().signOut()
      await refreshUser()
    }

    const deleteUser: AuthService['deleteUser'] = async () => {
      const user = firebase.auth().currentUser
      if (!user) {
        return { result: false, code: '', errorMessage: 'There is not user signed-in.' }
      }

      if (!(authStatus.value === 'WaitForEmailVerified' || authStatus.value === 'WaitForEntry' || authStatus.value === 'Available')) {
        throw new Error(`Cannot be performed with the current auth status: ${JSON.stringify({ authStatus: authStatus.value })}`)
      }

      try {
        await apis.deleteUser(user.uid)
        await firebase.auth().signOut()
      } catch (err) {
        console.error(err)
        return { result: false, code: err.code || '', errorMessage: err.message || '' }
      }

      await refreshUser()

      return { result: true, code: '', errorMessage: '' }
    }

    const updateEmail: AuthService['updateEmail'] = async newEmail => {
      const user = firebase.auth().currentUser
      if (!user) {
        return { result: false, code: '', errorMessage: 'There is not user signed-in.' }
      }

      if (!(authStatus.value === 'Available')) {
        throw new Error(`Cannot be performed with the current auth status: ${JSON.stringify({ authStatus: authStatus.value })}`)
      }

      try {
        firebase.auth().languageCode = 'ja'
        await user.updateEmail(newEmail)
      } catch (err) {
        return { result: false, code: err.code || '', errorMessage: err.message || '' }
      }

      await refreshUser()

      return { result: true, code: '', errorMessage: '' }
    }

    const fetchSignInMethodsForEmail: AuthService['fetchSignInMethodsForEmail'] = async email => {
      return (await firebase.auth().fetchSignInMethodsForEmail(email)) as AuthProviderType[]
    }

    const setUserInfo: AuthService['setUserInfo'] = async input => {
      const user = firebase.auth().currentUser
      if (!user) {
        return { result: false, code: '', errorMessage: 'There is not user signed-in.' }
      }

      if (!(authStatus.value === 'WaitForEntry' || authStatus.value === 'Available')) {
        throw new Error(`Cannot be performed with the current auth status: ${JSON.stringify({ authStatus: authStatus.value })}`)
      }

      const apiResult = await apis.setUserInfo(user.uid, input)
      if (apiResult.status === 'AlreadyExists') {
        return { result: false, code: '', errorMessage: String(i18n.t('auth.entry.userNameAlreadyExists')) }
      }

      // ユーザー情報登録待ちの状態だった場合
      if (authStatus.value === 'WaitForEntry') {
        // サーバーから認証情報を取得しクライアント側に反映
        await refreshUser()
      }
      // 既にユーザー情報登録が済んでいた場合
      else if (authStatus.value === 'Available') {
        // サーバーからの戻り値のユーザー情報をストアに設定
        // ※サーバーから認証情報を取得するまでの必要はない
        stores.user.set(apiResult.user!)
      }
      // 上記以外の場合
      else {
        throw new Error(``)
      }

      return { result: true, code: '', errorMessage: '' }
    }

    const validateSignedIn = helpers.auth.validateSignedIn

    const watchSignInStatus = helpers.auth.watchSignInStatus

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    async function refreshUser(): Promise<void> {
      const user = firebase.auth().currentUser
      // ローカルに認証ユーザーがある場合
      if (user) {
        // 認証データをサーバーから取得
        const authData = await apis.getAuthData()
        if (authData.status === 'Available') {
          // ストアにユーザーデータを設定
          stores.user.set(authData.user!)
          // カスタムトークンを認証トークンに設定
          try {
            await firebase.auth().signInWithCustomToken(authData.token)
          } catch (err) {
            Dialog.create({
              title: String(i18n.t('common.systemError')),
              message: String(i18n.t('error.unexpected')),
            })
            console.error(err)
          }
          // カスタムトークンをストアへ反映
          await stores.user.reflectCustomToken()
        }
        // 認証ステータスを設定
        helpers.auth.changeStatus(authData.status)
      }
      // ローカルに認証ユーザーがない場合
      else {
        // ストアをクリア
        stores.user.clear()
        // 認証ステータスをクリア
        helpers.auth.changeStatus('None')
      }
    }

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    /**
     * Firebaseの認証状態が変化した際のリスナです。
     * @param user
     */
    const firebaseOnAuthStateChanged = extendedMethod(async (user: firebase.User | null) => {
      await refreshUser()
    })
    firebase.auth().onAuthStateChanged(firebaseOnAuthStateChanged)

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      user: stores.user.value,
      authStatus,
      signInStatus,
      isSignedIn,
      isSigningIn,
      isNotSignedIn,
      checkSingedIn,
      signInWithGoogle,
      signInWithFacebook,
      signInWithEmailAndPassword,
      signInAnonymously,
      sendEmailVerification,
      sendPasswordResetEmail,
      createUserWithEmailAndPassword,
      signOut,
      deleteUser,
      updateEmail,
      fetchSignInMethodsForEmail,
      setUserInfo,
      validateSignedIn,
      watchSignInStatus,
      firebaseOnAuthStateChanged,
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { AuthService, AuthProviderType }
