<style lang="postcss" scoped>
@import '../../assets/styles/typography.pcss';

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

  & paper-icon-button + [main-title] {
    margin-left: 24px;
  }

  & .photo {
    width: 32px;
    height: 32px;
    border-radius: 50%;
  }

  & .systemMenuList {
    min-width: 150px;
  }
}

.drawer-list {
  & .item {
    display: block;
    padding: 8px 20px;
    @extend %app-font-code1;
    color: var(--app-secondary-text-color);
    text-decoration: none;
  }

  & .item.router-link-active {
    color: var(--app-accent-text-color);
  }
}

.link-button {
  color: var(--app-light-blue-a400);
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
          v-show="m_account.isSignedIn && !!m_account.photoURL"
          :src="m_account.photoURL"
          sizing="contain"
          class="photo"
        ></iron-image>
        <iron-icon
          v-show="m_account.isSignedIn && !m_account.photoURL"
          icon="social:person"
        ></iron-icon>
        <paper-menu-button ref="systemMenu" dynamic-align>
          <paper-icon-button icon="more-vert" slot="dropdown-trigger" alt="menu"></paper-icon-button>
          <paper-listbox
            ref="systemMenuList"
            slot="dropdown-content"
            @iron-select="m_menuOnIronSelect"
            class="systemMenuList"
          >
            <paper-item ref="signInItem" v-show="!m_account.isSignedIn">Sign in</paper-item>
            <paper-item ref="signOutItem" v-show="m_account.isSignedIn">Sign out</paper-item>
            <paper-item ref="changeEmailItem" v-show="m_account.isSignedIn">Change email</paper-item>
            <paper-item ref="deleteAccountItem" v-show="m_account.isSignedIn">Delete account</paper-item>
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
    <email-change-dialog ref="emailChangeDialog"></email-change-dialog>

  </div>
</template>


<script lang="ts">
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-icons/social-icons';
import '@polymer/iron-image/iron-image';
import '@polymer/iron-pages/iron-pages';
import '@polymer/iron-selector/iron-selector';
import '@polymer/paper-button/paper-button';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-item/paper-item';
import '@polymer/paper-listbox/paper-listbox';
import '@polymer/paper-menu-button/paper-menu-button';
import '@polymer/paper-toast/paper-toast';
import 'web-animations-js/web-animations-next-lite.min.js';

import * as sw from '../base/service-worker';
import EmailChangeDialog from './email-change-dialog/index';
import SignInDialog from './sign-in-dialog/index.vue';
import { Account } from '../stores/types';
import { BaseComponent } from '../base/component';
import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

@Component({
  components: {
    'sign-in-dialog': SignInDialog,
    'email-change-dialog': EmailChangeDialog,
  },
})
export default class AppView extends mixins(BaseComponent) {
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

  get m_account(): Account {
    return this.$stores.auth.account;
  }

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

  get m_emailChangeDialog(): EmailChangeDialog {
    return this.$refs.emailChangeDialog as any;
  }

  get m_signInItem() {
    return this.$refs.signInItem as any;
  }

  get m_signOutItem() {
    return this.$refs.signOutItem as any;
  }

  get m_changeEmailItem() {
    return this.$refs.changeEmailItem as any;
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
   * サインインダイアログを表示します。
   */
  m_showSignInDialog(): void {
    this.m_signInDialog.open();
  }

  /**
   * サインアウトを行います。
   */
  async m_signOut(): Promise<void> {
    await this.$stores.auth.signOut();
  }

  /**
   * メールアドレス変更ダイアログを表示します。
   */
  m_showEmailChangeDialog(): void {
    this.m_emailChangeDialog.open();
  }

  /**
   * ユーザーアカウントを削除します。
   */
  async m_deleteAccount(): Promise<void> {
    await this.$stores.auth.deleteAccount();
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  /**
   * ServiceWorkerの状態が変化した際のハンドラです。
   */
  m_swOnStateChange(info: sw.StateChangeInfo) {
    this.m_swMessage = info.message;
    this.m_swUpdateIsRequired = info.state === sw.ChangeState.updateIsRequired;
    this.$nextTick(() => this.m_swToast.open());

    // tslint:disable-next-line
    console.log(info);
  }

  /**
   * システムメニューで選択が行われた際のハンドラです。
   */
  async m_menuOnIronSelect(e: CustomEvent) {
    const selectedItemItem = e.detail.item;
    this.m_systemMenuList.selected = -1;
    if (selectedItemItem === this.m_signInItem) {
      this.m_showSignInDialog();
    } else if (selectedItemItem === this.m_signOutItem) {
      await this.m_signOut();
    } else if (selectedItemItem === this.m_changeEmailItem) {
      await this.m_showEmailChangeDialog();
    } else if (selectedItemItem === this.m_deleteAccountItem) {
      await this.m_deleteAccount();
    }
  }
}
</script>
