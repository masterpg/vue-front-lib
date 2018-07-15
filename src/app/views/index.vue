<style lang="stylus" scoped>
@import '../../assets/styles/_typography.styl';

app-drawer-layout {
  --app-drawer-width: 256px;
  &:not([narrow]) [drawer-toggle] {
    display: none;
  }
}

.drawer-toolbar {
}

.content-toolbar {
  background-color: var(--paper-indigo-a200);
  color: #fff;

  paper-icon-button + [main-title] {
    margin-left: 24px;
  }

  .photo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  .systemMenuList {
    min-width: 150px;
  }
}

.drawer-list {
  .item {
    display: block;
    padding: 8px 20px;
    @extend .app-font-code1;
    color: var(--app-secondary-text-color);
    text-decoration none;
  }

  .item.router-link-active {
    color: var(--app-accent-text-color);
  }
}

.link-button {
  color: var(--app-link-color);
}

paper-item {
  cursor: pointer;
}
</style>


<template>
  <div>

    <app-drawer-layout responsive-width="960px">

      <!--
        Drawer content
      -->
      <app-drawer ref="drawer" slot="drawer" :swipe-open="m_narrow">
        <app-toolbar class="drawer-toolbar">
          <iron-icon src="assets/images/manifest/icon-48x48.png"></iron-icon>
          <div main-title class="app-ml-8">Vue WWW Base</div>
        </app-toolbar>
        <div class="drawer-list">
          <template v-for="item in m_items">
            <router-link :to="item.path" class="item">{{ item.title }}</router-link>
          </template>
        </div>
      </app-drawer>

      <!--
        Main content
      -->
      <app-toolbar class="content-toolbar">
        <paper-icon-button icon="menu" drawer-toggle></paper-icon-button>
        <div main-title>View name</div>
        <iron-image
          v-show="m_user.isSignedIn && !!m_user.photoURL"
          :src="m_user.photoURL"
          sizing="contain"
          class="photo"
        ></iron-image>
        <paper-menu-button ref="systemMenu" dynamic-align>
          <paper-icon-button icon="more-vert" slot="dropdown-trigger" alt="menu"></paper-icon-button>
          <paper-listbox
            ref="systemMenuList"
            slot="dropdown-content"
            @iron-select="m_menuOnIronSelect"
            class="systemMenuList"
          >
            <paper-item ref="signInItem" v-show="!m_user.isSignedIn">Sign in</paper-item>
            <paper-item ref="signOutItem" v-show="m_user.isSignedIn">Sign out</paper-item>
            <paper-item ref="deleteAccountItem" v-show="m_user.isSignedIn">Delete Account</paper-item>
          </paper-listbox>
        </paper-menu-button>
      </app-toolbar>

      <router-view/>

    </app-drawer-layout>

    <paper-toast ref="swToast" :duration="m_swUpdateIsRequired ? 0 : 5000" :text="m_swMessage">
      <paper-button
        v-show="m_swUpdateIsRequired"
        class="link-button"
        @click="m_reload"
      >再読み込み
      </paper-button>
    </paper-toast>

    <sign-in-dialog ref="signInDialog"></sign-in-dialog>

  </div>
</template>


<script lang="ts">
import 'web-animations-js/web-animations-next-lite.min.js';
import * as firebase from 'firebase';
import * as sw from '../service-worker';
import SignInDialog from './sign-in-dialog/index.vue';
import { Component } from 'vue-property-decorator';
import { ElementComponent } from '../components';
import { mixins } from 'vue-class-component';

import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-image/iron-image';
import '@polymer/iron-pages/iron-pages';
import '@polymer/iron-selector/iron-selector';
import '@polymer/paper-button/paper-button';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-item/paper-item';
import '@polymer/paper-listbox/paper-listbox';
import '@polymer/paper-menu-button/paper-menu-button';
import '@polymer/paper-toast/paper-toast';

@Component({
  components: {
    'sign-in-dialog': SignInDialog,
  },
})
export default class AppView extends mixins(ElementComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  m_narrow: boolean = false;

  m_items: Array<{ title: string; path: string }> = [
    {
      title: 'ABC',
      path: '/abc',
    },
    {
      title: 'Shopping',
      path: '/shopping',
    },
  ];

  m_swMessage: string = '';

  m_swUpdateIsRequired: boolean = false;

  m_user: { isSignedIn: boolean; photoURL: string | null } = {
    isSignedIn: false,
    photoURL: null,
  };

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_swToast(): { open: () => void } {
    return this.$refs.swToast as any;
  }

  get m_systemMenu(): { close: () => void } {
    return this.$refs.systemMenu as any;
  }

  get m_systemMenuList(): { selected: string | number } {
    return this.$refs.systemMenuList as any;
  }

  get m_signInDialog(): SignInDialog {
    return this.$refs.signInDialog as any;
  }

  get m_signInItem() {
    return this.$refs.signInItem as any;
  }

  get m_signOutItem() {
    return this.$refs.signOutItem as any;
  }

  get m_deleteAccountItem() {
    return this.$refs.deleteAccountItem as any;
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    sw.addStateChangeListener(this.m_swOnStateChange);

    this.m_checkSingedIn().then(() => {
      firebase.auth().onAuthStateChanged(this.m_firebaseOnAuthStateChanged.bind(this));
    });
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  m_reload(): void {
    window.location.reload();
  }

  /**
   * サインイン(リダイレクト型式による)が行われているかチェックを行います。
   */
  async m_checkSingedIn() {
    let redirected: firebase.auth.UserCredential;
    try {
      // リダイレクト型式によるサインインの認証情報を取得
      redirected = await firebase.auth().getRedirectResult();
    } catch (err) {
      const errorCode = err.code;
      const errorMessage = err.message;
      const email = err.email;
      const credential = err.credential;
      console.error(err);
      return;
    }

    if (redirected.credential) {
      // Googleのアクセストークンを取得
      // このトークンはGoogleAPIにアクセスする際に使用する
      const token = (redirected.credential as any).accessToken;
    }
  }

  /**
   * ユーザーがサインインした状態の処理を行います。
   * @param user
   */
  m_handleSignedInUser(user: firebase.User): void {
    this.m_user.isSignedIn = true;
    this.m_user.photoURL = user ? user.photoURL : '';
  }

  /**
   * ユーザーがサインアウトした状態の処理を行います。
   */
  m_handleSignedOutUser(): void {
    this.m_user.isSignedIn = false;
    this.m_user.photoURL = '';
  }

  /**
   * サインインダイアログを表示します。
   */
  async m_signIn() {
    this.m_signInDialog.open();
  }

  /**
   * サインアウトを行います。
   */
  async m_signOut(): Promise<void> {
    await firebase.auth().signOut();
  }

  /**
   * ユーザーアカウントを削除します。
   */
  async m_deleteAccount(): Promise<void> {
    const currentUser = firebase.auth().currentUser;
    if (!currentUser) return;

    try {
      await currentUser.delete();
    } catch (err) {
      // ユーザーの認証情報が古すぎる場合、サインアウト
      // (一旦サインアウトしてから再度サインインが必要なため)
      if (err.code == 'auth/requires-recent-login') {
        await this.m_signOut();
      }
      // ユーザーの認証情報が古すぎる以外のエラーの場合、そのままthrow
      else {
        throw err;
      }
    }
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  /**
   * ServecWorkerの状態が変化した際のハンドラです。
   */
  m_swOnStateChange(info: sw.StateChangeInfo) {
    this.m_swMessage = info.message;
    this.m_swUpdateIsRequired = info.state === sw.ChangeState.updateIsRequired;
    this.$nextTick(() => this.m_swToast.open());

    // tslint:disable-next-line
    console.log(info);
  }

  /**
   * Firebaseの認証状態が変化した際のハンドラです。
   * @param user
   */
  m_firebaseOnAuthStateChanged(user?: firebase.User) {
    this.m_systemMenu.close();
    if (user) {
      this.m_handleSignedInUser(user);
    } else {
      this.m_handleSignedOutUser();
    }
  }

  /**
   * システムメニューで選択が行われた際のハンドラです。
   */
  m_menuOnIronSelect(e: CustomEvent) {
    const selectedItemItem = e.detail.item;
    this.m_systemMenuList.selected = -1;
    if (selectedItemItem === this.m_signInItem) {
      this.m_signIn();
    } else if (selectedItemItem === this.m_signOutItem) {
      this.m_signOut();
    } else if (selectedItemItem === this.m_deleteAccountItem) {
      this.m_deleteAccount();
    }
  }
}
</script>
