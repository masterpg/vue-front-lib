import { AuthLogic, AuthProviderType } from '../../types'
import { BaseLogic, SignedInListenerFunc, SignedOutListenerFunc } from '../../base'
import { Component, Watch } from 'vue-property-decorator'
import { User, store } from '../../store'
import { Dialog } from 'quasar'
import { NoCache } from '../../../base/decorators'
import { api } from '../../api'
import { i18n } from '../../../i18n'

@Component
export class AuthLogicImpl extends BaseLogic implements AuthLogic {
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
      await this.m_refreshUser()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }
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
    profile: { displayName: string; photoURL: string | null }
  ): Promise<{ result: boolean; code: string; errorMessage: string }> {
    try {
      // メールアドレス＋パスワードでアカウント作成
      await firebase.auth().createUserWithEmailAndPassword(email, password)
      // 作成されたアカウントに表示名を設定
      await firebase.auth().currentUser!.updateProfile(profile)
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    await this.m_refreshUser()

    return { result: true, code: '', errorMessage: '' }
  }

  async sendEmailVerification(continueURL: string): Promise<void> {
    const user = firebase.auth().currentUser
    if (!user) {
      const err = new Error('There is not user signed-in.')
      throw err
    }

    firebase.auth().languageCode = 'ja'
    await firebase.auth().currentUser!.sendEmailVerification({
      url: continueURL,
      handleCodeInApp: false,
    })
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

  async deleteAccount(): Promise<{ result: boolean; code: string; errorMessage: string }> {
    const user = firebase.auth().currentUser
    if (!user) {
      return { result: false, code: '', errorMessage: 'There is not user signed-in.' }
    }

    try {
      await user.delete()
      await this.m_refreshUser()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

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
      await this.m_refreshUser()
    } catch (err) {
      return { result: false, code: err.code || '', errorMessage: err.message || '' }
    }

    return { result: true, code: '', errorMessage: '' }
  }

  async fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]> {
    return (await firebase.auth().fetchSignInMethodsForEmail(email)) as AuthProviderType[]
  }

  addSignedInListener(listener: SignedInListenerFunc): void {
    super.addSignedInListener(listener)
  }

  removeSignedInListener(listener: SignedInListenerFunc): void {
    super.removeSignedInListener(listener)
  }

  addSignedOutListener(listener: SignedOutListenerFunc): void {
    super.addSignedOutListener(listener)
  }

  removeSignedOutListener(listener: SignedOutListenerFunc): void {
    super.removeSignedOutListener(listener)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_refreshUser(): Promise<void> {
    const user = firebase.auth().currentUser
    if (user) {
      // サインインしたかどうかを判定
      let isSignedIn = true
      if (user.email) {
        // アカウントがメールアドレスを持っている場合、
        // アカウントが持つ認証プロバイダの中にパスワード認証があるか調べる
        const providers = await this.fetchSignInMethodsForEmail(user.email)
        const passwordProviderExists = providers.some(provider => provider === AuthProviderType.Password)
        // アカウントが持つ認証プロバイダがパスワード認証のみでかつ、
        // メールアドレス確認が行われていない場合
        if (passwordProviderExists && providers.length === 1 && !user.emailVerified) {
          isSignedIn = false
        }
      }
      // ストアのユーザー設定
      store.user.set({
        id: user.uid,
        isSignedIn: isSignedIn,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        email: user.email || '',
        emailVerified: user.emailVerified,
      })
    } else {
      store.user.clear()
    }
  }

  /**
   * サインインした際に必要な処理を行います。
   */
  private async m_signedInProcess(): Promise<void> {
    // カスタムトークンをサーバーから取得
    try {
      const customToken = await api.customToken()
      await firebase.auth().signInWithCustomToken(customToken)
    } catch (err) {
      Dialog.create({
        title: String(i18n.t('common.systemError')),
        message: String(i18n.t('error.unexpected')),
      })
      console.error(err)
    }
    // 取得したカスタムトークンをストアへ反映
    await store.user.reflectCustomToken()
    // 登録されているサインインリスナの実行
    this.signedInListeners.forEach(listener => listener(this.user))
  }

  /**
   * サインアウトした際に必要な処理を行います。
   */
  private async m_signedOutProcess(): Promise<void> {
    // 登録されているサインアウトリスナの実行
    this.signedOutListeners.forEach(listener => listener(this.user))
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

  /**
   * サインイン/アウトの状態が変化した際のリスナです。
   * @param newValue
   * @param oldValue
   */
  @Watch('user.isSignedIn')
  private async m_userIsSignedInOnChanged(newValue: boolean, oldValue: boolean) {
    if (newValue) {
      await this.m_signedInProcess()
    } else {
      await this.m_signedOutProcess()
    }
  }
}
