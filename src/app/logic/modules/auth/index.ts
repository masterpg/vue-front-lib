import { AuthStatus, UserInfo, UserInfoInput } from '@/app/logic/base'
import { ComputedRef, computed, reactive } from '@vue/composition-api'
import { DeepReadonly } from 'web-base-lib'
import { Dialog } from 'quasar'
import { injectAPI } from '@/app/logic/api'
import { injectInternalLogic } from '@/app/logic/modules/internal'
import { injectStore } from '@/app/logic/store'
import { useI18n } from '@/app/i18n'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AuthLogic {
  readonly user: DeepReadonly<UserInfo>

  readonly status: ComputedRef<AuthStatus>

  readonly isSignedIn: ComputedRef<boolean>

  readonly isSigningIn: ComputedRef<boolean>

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

  setUser(input: UserInfoInput): Promise<void>

  validateSignedIn(): void
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

function createAuthLogic(): AuthLogic {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  const internal = injectInternalLogic()
  const store = injectStore()
  const api = injectAPI()
  const { t } = useI18n()

  const state = reactive({
    isSigningIn: false,
  })

  const googleProvider = new firebase.auth.GoogleAuthProvider()
  googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly')

  const facebookProvider = new firebase.auth.FacebookAuthProvider()
  facebookProvider.addScope('user_birthday')

  // サインイン中フラグをオン
  state.isSigningIn = true

  firebase.auth().onAuthStateChanged(firebaseOnAuthStateChanged)

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  const status = computed(() => internal.auth.status.value)

  const isSignedIn = computed(() => internal.auth.isSignedIn.value)

  const isSigningIn = computed(() => state.isSigningIn)

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  const checkSingedIn: AuthLogic['checkSingedIn'] = async () => {
    // リダイレクト式によるサインインの認証情報を取得
    const redirected = await firebase.auth().getRedirectResult()

    if (redirected.credential) {
      // Googleのアクセストークンを取得
      // このトークンはGoogleAPIにアクセスする際に使用する
      const token = (redirected.credential as any).accessToken
    }
  }

  const signInWithGoogle: AuthLogic['signInWithGoogle'] = async () => {
    await firebase.auth().signInWithRedirect(googleProvider)
  }

  const signInWithFacebook: AuthLogic['signInWithFacebook'] = async () => {
    await firebase.auth().signInWithRedirect(facebookProvider)
  }

  const signInWithEmailAndPassword: AuthLogic['signInWithEmailAndPassword'] = async (email, password) => {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password)
    } catch (err) {
      console.error(err)
      let errorMessage: string | undefined
      if (err.code === 'auth/wrong-password') {
        errorMessage = String(t('auth.authFailedCode.wrongPassword'))
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = String(t('auth.authFailedCode.userNotFound'))
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = String(t('auth.authFailedCode.tooManyRequests'))
      }
      return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
    }

    await refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  const signInAnonymously: AuthLogic['signInAnonymously'] = async () => {
    try {
      await firebase.auth().signInAnonymously()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }
    return { result: true, code: '', errorMessage: '' }
  }

  const createUserWithEmailAndPassword: AuthLogic['createUserWithEmailAndPassword'] = async (email, password, profile) => {
    try {
      // メールアドレス＋パスワードでアカウント作成
      await firebase.auth().createUserWithEmailAndPassword(email, password)
      // 作成されたアカウントに表示名を設定
      await firebase.auth().currentUser!.updateProfile(profile)
    } catch (err) {
      console.error(err)
      let errorMessage: string | undefined
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = String(t('auth.authFailedCode.emailAlreadyInUse'))
      }
      return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
    }

    await refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  const sendEmailVerification: AuthLogic['sendEmailVerification'] = async continueURL => {
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
        errorMessage = String(t('auth.authFailedCode.tooManyRequests'))
      }
      return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
    }

    return { result: true, code: '', errorMessage: '' }
  }

  const sendPasswordResetEmail: AuthLogic['sendPasswordResetEmail'] = async (email, continueURL) => {
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

  const signOut: AuthLogic['signOut'] = async () => {
    await firebase.auth().signOut()
    await refreshUser()
  }

  const deleteUser: AuthLogic['deleteUser'] = async () => {
    const user = firebase.auth().currentUser
    if (!user) {
      return { result: false, code: '', errorMessage: 'There is not user signed-in.' }
    }

    try {
      await api.deleteOwnUser()
      await firebase.auth().signOut()
    } catch (err) {
      console.error(err)
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    await refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  const updateEmail: AuthLogic['updateEmail'] = async newEmail => {
    const user = firebase.auth().currentUser
    if (!user) {
      return { result: false, code: '', errorMessage: 'There is not user signed-in.' }
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

  const fetchSignInMethodsForEmail: AuthLogic['fetchSignInMethodsForEmail'] = async email => {
    return (await firebase.auth().fetchSignInMethodsForEmail(email)) as AuthProviderType[]
  }

  const setUser: AuthLogic['setUser'] = async input => {
    const user = await api.setOwnUserInfo(input)
    if (status.value === AuthStatus.WaitForEntry) {
      await refreshUser()
    } else {
      store.user.set(user)
    }
  }

  const validateSignedIn = internal.auth.validateSignedIn

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
      const authData = await api.getAuthData()
      if (authData.status === AuthStatus.Available) {
        // ストアにユーザーデータを設定
        store.user.set(authData.user!)
        // カスタムトークンを認証トークンに設定
        try {
          await firebase.auth().signInWithCustomToken(authData.token)
        } catch (err) {
          Dialog.create({
            title: String(t('common.systemError')),
            message: String(t('error.unexpected')),
          })
          console.error(err)
        }
        // カスタムトークンをストアへ反映
        await store.user.reflectCustomToken()
      }
      // 認証ステータスを設定
      internal.auth.status.value = authData.status
      // サインインされたなら、サインイン中フラグをオフ
      if (isSignedIn.value) {
        state.isSigningIn = false
      }
    }
    // ローカルに認証ユーザーがない場合
    else {
      // ストアをクリア
      store.user.clear()
      // 認証ステータスをクリア
      internal.auth.status.value = AuthStatus.None
      // サインイン中フラグをオフ
      state.isSigningIn = false
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
  async function firebaseOnAuthStateChanged(user: firebase.User | null) {
    await refreshUser()
  }

  //----------------------------------------------------------------------
  //
  //  Result
  //
  //----------------------------------------------------------------------

  return {
    user: store.user.value,
    status,
    isSignedIn,
    isSigningIn,
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
    setUser,
    validateSignedIn,
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { AuthLogic, AuthProviderType, createAuthLogic }
