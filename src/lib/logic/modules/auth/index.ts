import { AuthStatus, User, UserInfoInput, api } from '../../api'
import { BaseLogic } from '../../base'
import { Component } from 'vue-property-decorator'
import { Dialog } from 'quasar'
import { NoCache } from '@/lib/base/decorators'
import { i18n } from '@/lib/i18n'
import { store } from '../../store'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface AuthLogic {
  readonly user: User

  readonly status: AuthStatus

  readonly isSignedIn: boolean

  checkSingedIn(): Promise<void>

  signInWithGoogle(): Promise<void>

  signInWithFacebook(): Promise<void>

  signInWithEmailAndPassword(email: string, password: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  signInAnonymously(): Promise<{ result: boolean; code: string; errorMessage: string }>

  sendEmailVerification(continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  sendPasswordResetEmail(email: string, continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }>

  signOut(): Promise<void>

  deleteUser(): Promise<{ result: boolean; code: string; errorMessage: string }>

  updateEmail(newEmail: string): Promise<{ result: boolean; code: string; errorMessage: string }>

  fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]>

  setUser(input: UserInfoInput): Promise<void>
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

@Component
class AuthLogicImpl extends BaseLogic implements AuthLogic {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    this.m_googleProvider = new firebase.auth.GoogleAuthProvider()
    this.m_googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly')

    this.m_facebookProvider = new firebase.auth.FacebookAuthProvider()
    this.m_facebookProvider.addScope('user_birthday')

    firebase.auth().onAuthStateChanged(this.m_firebaseOnAuthStateChanged)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get user(): User {
    return store.user.clone()
  }

  get status(): AuthStatus {
    return this.authStatus
  }

  get isSignedIn(): boolean {
    return this.authStatus === AuthStatus.Available
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_googleProvider!: firebase.auth.GoogleAuthProvider

  private m_facebookProvider!: firebase.auth.FacebookAuthProvider

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async checkSingedIn(): Promise<void> {
    // リダイレクト式によるサインインの認証情報を取得
    const redirected = await firebase.auth().getRedirectResult()

    if (redirected.credential) {
      // Googleのアクセストークンを取得
      // このトークンはGoogleAPIにアクセスする際に使用する
      const token = (redirected.credential as any).accessToken
    }
  }

  async signInWithGoogle(): Promise<void> {
    await firebase.auth().signInWithRedirect(this.m_googleProvider)
  }

  async signInWithFacebook(): Promise<void> {
    await firebase.auth().signInWithRedirect(this.m_facebookProvider)
  }

  async signInWithEmailAndPassword(email: string, password: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password)
    } catch (err) {
      console.error(err)
      let errorMessage: string | undefined
      if (err.code === 'auth/wrong-password') {
        errorMessage = String(this.$t('auth.authFailedCode.wrongPassword'))
      } else if (err.code === 'auth/user-not-found') {
        errorMessage = String(this.$t('auth.authFailedCode.userNotFound'))
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = String(this.$t('auth.authFailedCode.tooManyRequests'))
      }
      return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
    }

    await this.m_refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  async signInAnonymously(): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      await firebase.auth().signInAnonymously()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }
    return { result: true, code: '', errorMessage: '' }
  }

  async createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      // メールアドレス＋パスワードでアカウント作成
      await firebase.auth().createUserWithEmailAndPassword(email, password)
      // 作成されたアカウントに表示名を設定
      await firebase.auth().currentUser!.updateProfile(profile)
    } catch (err) {
      console.error(err)
      let errorMessage: string | undefined
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = String(this.$t('auth.authFailedCode.emailAlreadyInUse'))
      }
      return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
    }

    await this.m_refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  async sendEmailVerification(continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
    const user = firebase.auth().currentUser
    if (!user) {
      const err = new Error('There is not user signed-in.')
      throw err
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
        errorMessage = String(this.$t('auth.authFailedCode.tooManyRequests'))
      }
      return { result: false, code: err.code || '', errorMessage: errorMessage || err.message || '' }
    }

    return { result: true, code: '', errorMessage: '' }
  }

  async sendPasswordResetEmail(email: string, continueURL: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
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

  async signOut(): Promise<void> {
    await firebase.auth().signOut()
    await this.m_refreshUser()
  }

  async deleteUser(): Promise<{ result: boolean; code: string; errorMessage: string }> {
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

    await this.m_refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  async updateEmail(newEmail: string): Promise<{ result: boolean; code: string; errorMessage: string }> {
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

    await this.m_refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  async fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]> {
    return (await firebase.auth().fetchSignInMethodsForEmail(email)) as AuthProviderType[]
  }

  async setUser(input: UserInfoInput): Promise<void> {
    const user = await api.setOwnUserInfo(input)
    if (this.authStatus === AuthStatus.WaitForEntry) {
      await this.m_refreshUser()
    } else {
      store.user.set(user)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_refreshUser(): Promise<void> {
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
            title: String(i18n.t('common.systemError')),
            message: String(i18n.t('error.unexpected')),
          })
          console.error(err)
        }
        // カスタムトークンをストアへ反映
        await store.user.reflectCustomToken()
      }
      // 認証ステータスを設定
      this.setAuthStatus(authData.status)
    }
    // ローカルに認証ユーザーがない場合
    else {
      // ストアをクリア
      store.user.clear()
      // 認証ステータスをクリア
      this.setAuthStatus(AuthStatus.None)
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
  private async m_firebaseOnAuthStateChanged(user: firebase.User | null) {
    await this.m_refreshUser()
  }
}

//========================================================================
//
//  Interfaces
//
//========================================================================

export { AuthLogic, AuthProviderType, AuthLogicImpl }
