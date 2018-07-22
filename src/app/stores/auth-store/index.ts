import { Account, AuthStore, AuthProviderType } from '../types';
import { BaseStore } from '../base';
import { Component } from 'vue-property-decorator';
import { NoCache } from '../../components';

export interface AccountState {
  isSignedIn: boolean;
  displayName: string;
  photoURL: string;
  emailVerified: boolean;
}

@Component
export class AuthStoreImpl extends BaseStore<AccountState> implements AuthStore {
  //----------------------------------------------------------------------
  //
  //  Constructors
  //
  //----------------------------------------------------------------------

  constructor() {
    super();
    this.f_initState({
      isSignedIn: false,
      displayName: '',
      photoURL: '',
      emailVerified: false,
    });

    this.m_googleProvider = new firebase.auth.GoogleAuthProvider();
    this.m_googleProvider.addScope('https://www.googleapis.com/auth/contacts.readonly');

    this.m_facebookProvider = new firebase.auth.FacebookAuthProvider();
    this.m_facebookProvider.addScope('user_birthday');

    firebase.auth().onAuthStateChanged(this.m_firebaseOnAuthStateChanged.bind(this));
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_googleProvider: firebase.auth.GoogleAuthProvider;

  m_facebookProvider: firebase.auth.FacebookAuthProvider;

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @NoCache
  get account(): Account {
    return this.$utils.cloneDeep(this.f_state);
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    await this.checkSingedIn();
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  async checkSingedIn(): Promise<void> {
    let redirected: firebase.auth.UserCredential;
    try {
      // リダイレクト型式によるサインインの認証情報を取得
      redirected = await firebase.auth().getRedirectResult();
    } catch (err) {
      throw err;
    }

    if (redirected.credential) {
      // Googleのアクセストークンを取得
      // このトークンはGoogleAPIにアクセスする際に使用する
      const token = (redirected.credential as any).accessToken;
    }
  }

  async signInWithGoogle(): Promise<void> {
    await firebase.auth().signInWithRedirect(this.m_googleProvider);
  }

  async signInWithFacebook(): Promise<void> {
    await firebase.auth().signInWithRedirect(this.m_facebookProvider);
  }

  async signInWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<{ result: boolean; errorMessage: string }> {
    try {
      await firebase.auth().signInWithEmailAndPassword(email, password);
      await this.m_refreshAccount();
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        return { result: false, errorMessage: err.message };
      } else {
        throw err;
      }
    }
    return { result: true, errorMessage: '' };
  }

  async createUserWithEmailAndPassword(
    email: string,
    password,
    profile: { displayName: string; photoURL: string | null },
  ): Promise<void> {
    try {
      // メールアドレス＋パスワードでアカウント作成
      await firebase.auth().createUserWithEmailAndPassword(email, password);
      // 作成されたアカウントに表示名を設定
      await firebase.auth().currentUser!.updateProfile(profile);

      await this.m_refreshAccount();
    } catch (err) {
      throw err;
    }
  }

  async sendEmailVerification(continueURL: string): Promise<void> {
    const user = firebase.auth().currentUser;
    if (!user) {
      const err = new Error('There is not account signed-in.');
      throw err;
    }

    firebase.auth().languageCode = 'ja';
    await firebase.auth().currentUser!.sendEmailVerification({
      url: continueURL,
      handleCodeInApp: false,
    });
  }

  async sendPasswordResetEmail(email: string, continueURL: string): Promise<void> {
    firebase.auth().languageCode = 'ja';
    await firebase.auth().sendPasswordResetEmail(email, {
      url: continueURL,
      handleCodeInApp: false,
    });
  }

  async signOut(): Promise<void> {
    await firebase.auth().signOut();
    await this.m_refreshAccount();
  }

  async deleteAccount(): Promise<void> {
    const user = firebase.auth().currentUser;
    if (!user) {
      const err = new Error('There is not account signed-in.');
      throw err;
    }

    try {
      await user.delete();
      await this.m_refreshAccount();
    } catch (err) {
      // ユーザーの認証情報が古すぎる場合、サインアウト
      // (一旦サインアウトしてから再度サインインが必要なため)
      if (err.code === 'auth/requires-recent-login') {
        await this.signOut();
      }
      // 上記以外のエラーの場合
      else {
        throw err;
      }
    }
  }

  async updateEmail(newEmail: string): Promise<void> {
    const user = firebase.auth().currentUser;
    if (!user) {
      const err = new Error('There is not account signed-in.');
      throw err;
    }

    try {
      firebase.auth().languageCode = 'ja';
      await user.updateEmail(newEmail);
      await this.m_refreshAccount();
    } catch (err) {
      // ユーザーの認証情報が古すぎる場合、サインアウト
      // (一旦サインアウトしてから再度サインインが必要なため)
      if (err.code === 'auth/requires-recent-login') {
        await this.signOut();
      }
      // 上記以外のエラーの場合
      else {
        throw err;
      }
    }
  }

  async fetchSignInMethodsForEmail(email: string): Promise<AuthProviderType[]> {
    return (await firebase.auth().fetchSignInMethodsForEmail(email)) as AuthProviderType[];
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  async m_refreshAccount(): Promise<void> {
    const user = firebase.auth().currentUser;
    if (user) {
      let isSignedIn = true;
      // アカウントがメールアドレスを持っている場合
      if (user.email) {
        // アカウントが持つ認証プロバイダの中にパスワード認証があるか調べる
        const providers = await this.fetchSignInMethodsForEmail(user.email);
        const passwordProviderExists = providers.some(
          (provider) => provider === AuthProviderType.Password,
        );
        // アカウントが持つ認証プロバイダがパスワード認証のみでかつ、
        // メールアドレス確認が行われていない場合
        if (passwordProviderExists && providers.length === 1 && !user.emailVerified) {
          isSignedIn = false;
        }
      }
      this.f_state.isSignedIn = isSignedIn;
      this.f_state.displayName = user.displayName || '';
      this.f_state.photoURL = user.photoURL || '';
      this.f_state.emailVerified = user.emailVerified;
    } else {
      this.f_state.isSignedIn = false;
      this.f_state.displayName = '';
      this.f_state.photoURL = '';
      this.f_state.emailVerified = false;
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  /**
   * Firebaseの認証状態が変化した際のハンドラです。
   * @param user
   */
  async m_firebaseOnAuthStateChanged(user?: firebase.User) {
    await this.m_refreshAccount();
  }
}

export function newAuthStore(): AuthStore {
  return new AuthStoreImpl();
}
