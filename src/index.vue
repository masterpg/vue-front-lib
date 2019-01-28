<style scoped lang="polymer">
/* PolymerのCSS Mixinの設定はこの領域に記述すること */

app-drawer {
  --app-drawer-content-container: {
    background-color: var(--comm-grey-100);
  }
}

@media (min-width: 600px) {
  app-drawer {
    --app-drawer-content-container: {
      background-color: var(--comm-grey-100);
      border-right: 1px solid var(--comm-grey-300);
    }
  }
}
</style>

<style scoped>
@import './styles/placeholder/typography.css';

app-drawer-layout {
  --app-drawer-width: 300px;
  &:not([narrow]) [drawer-toggle] {
    display: none;
  }
}

.drawer-toolbar {
}

.content-toolbar {
  background-color: var(--comm-indigo-a200);
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
    @extend %comm-font-code1;
    color: var(--app-secondary-text-color);
    text-decoration: none;
  }

  & .item.router-link-active {
    color: var(--app-accent-text-color);
  }
}

.link-button {
  color: var(--comm-light-blue-a400);
}

paper-item {
  cursor: pointer;
}

/* -----> */
/**
 * Animate.cssにある既存のアニメーションをコピーして変更している。
 * コピー元: node_modules/animate.css/animate.css
 */
@keyframes tada {
  from {
    transform: scale3d(1, 1, 1);
  }
  10%,
  20% {
    transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg);
  }
  30%,
  70% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg);
  }
  50%,
  80% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg);
  }
  to {
    transform: scale3d(1, 1, 1);
  }
}

.tada {
  animation-name: tada;
}
/* <----- */

/* -----> */
/**
 * tada と bounceOutRight のアニメーションスピードを調整
 */
.animated.tada.faster {
  animation-duration: 700ms;
}

.animated.bounceOutRight.faster {
  animation-duration: 700ms;
}
/* <----- */

/**
 * フェードイン/アウトのサンプル。このアニメーションを有効にするには、下記のコメントを外し、
 * transitionタグの enter-active-class と leave-active-class を削除るとこのアニメーションが有効になる。
 */
/*
.view-enter-active,
.view-leave-active {
  transition: opacity 0.2s ease;
}
.view-enter,
.view-leave-to {
  opacity: 0;
}
*/
</style>

<template>
  <div>
    <app-drawer-layout responsive-width="960px">
      <!-- Drawer content -->
      <app-drawer ref="drawer" slot="drawer" :swipe-open="m_narrow">
        <app-toolbar class="drawer-toolbar">
          <iron-icon src="img/icons/manifest/icon-48x48.png"></iron-icon>
          <div main-title class="comm-ml-8">Vue WWW Base</div>
        </app-toolbar>
        <div class="drawer-list">
          <template v-for="(item, index) in m_items">
            <router-link :key="index" :to="item.path" class="item">{{ item.title }}</router-link>
          </template>
        </div>
      </app-drawer>

      <!-- Main content -->
      <app-toolbar class="content-toolbar">
        <paper-icon-button icon="menu" drawer-toggle></paper-icon-button>
        <div main-title>View name</div>
        <iron-image v-show="m_account.isSignedIn && !!m_account.photoURL" :src="m_account.photoURL" sizing="contain" class="photo"></iron-image>
        <iron-icon v-show="m_account.isSignedIn && !m_account.photoURL" icon="social:person"></iron-icon>
        <paper-menu-button ref="systemMenu" dynamic-align>
          <paper-icon-button slot="dropdown-trigger" icon="more-vert" alt="menu"></paper-icon-button>
          <paper-listbox ref="systemMenuList" slot="dropdown-content" class="systemMenuList" @iron-select="m_menuOnIronSelect">
            <paper-item v-show="!m_account.isSignedIn" ref="signInItem">Sign in</paper-item>
            <paper-item v-show="m_account.isSignedIn" ref="signOutItem">Sign out</paper-item>
            <paper-item v-show="m_account.isSignedIn" ref="changeEmailItem">Change email</paper-item>
            <paper-item v-show="m_account.isSignedIn" ref="deleteAccountItem">Delete account</paper-item>
          </paper-listbox>
        </paper-menu-button>
      </app-toolbar>

      <transition name="view" mode="out-in" enter-active-class="animated tada faster" leave-active-class="animated bounceOutRight faster">
        <router-view />
      </transition>
    </app-drawer-layout>

    <paper-toast ref="swToast" :duration="m_swUpdateIsRequired ? 0 : 5000" :text="m_swMessage">
      <paper-button v-show="m_swUpdateIsRequired" class="link-button" @click="m_reload">{{ $t('reload') }}</paper-button>
    </paper-toast>

    <sign-in-dialog ref="signInDialog"></sign-in-dialog>
    <email-change-dialog ref="emailChangeDialog"></email-change-dialog>
  </div>
</template>

<script lang="ts">
import '@polymer/app-layout/app-drawer-layout/app-drawer-layout'
import '@polymer/app-layout/app-drawer/app-drawer'
import '@polymer/app-layout/app-header-layout/app-header-layout'
import '@polymer/app-layout/app-header/app-header'
import '@polymer/app-layout/app-toolbar/app-toolbar'
import '@polymer/iron-icon/iron-icon'
import '@polymer/iron-icons/iron-icons'
import '@polymer/iron-icons/social-icons'
import '@polymer/iron-image/iron-image'
import '@polymer/iron-pages/iron-pages'
import '@polymer/iron-selector/iron-selector'
import '@polymer/paper-button/paper-button'
import '@polymer/paper-icon-button/paper-icon-button'
import '@polymer/paper-item/paper-item'
import '@polymer/paper-listbox/paper-listbox'
import '@polymer/paper-menu-button/paper-menu-button'
import '@polymer/paper-toast/paper-toast'
import 'web-animations-js/web-animations-next-lite.min.js'

import * as sw from '@/base/service-worker'
import EmailChangeDialog from '@/views/email-change-dialog/index.vue'
import SignInDialog from '@/views/sign-in-dialog/index.vue'
import { Account } from '@/stores/types'
import { BaseComponent } from '@/base/component'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

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

  m_narrow: boolean = false

  m_items: Array<{ title: string, path: string }> = [
    {
      title: 'ABC',
      path: '/pages/abc',
    },
    {
      title: 'Shopping',
      path: '/pages/shopping',
    },
  ]

  m_swMessage: string = ''

  m_swUpdateIsRequired: boolean = false

  get m_account(): Account {
    return this.$stores.auth.account
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_swToast(): { open: () => void } {
    return this.$refs.swToast as any
  }

  get m_systemMenu(): { close: () => void } {
    return this.$refs.systemMenu as any
  }

  get m_systemMenuList(): { selected: string | number } {
    return this.$refs.systemMenuList as any
  }

  get m_signInDialog(): SignInDialog {
    return this.$refs.signInDialog as any
  }

  get m_emailChangeDialog(): EmailChangeDialog {
    return this.$refs.emailChangeDialog as any
  }

  get m_signInItem() {
    return this.$refs.signInItem as any
  }

  get m_signOutItem() {
    return this.$refs.signOutItem as any
  }

  get m_changeEmailItem() {
    return this.$refs.changeEmailItem as any
  }

  get m_deleteAccountItem() {
    return this.$refs.deleteAccountItem as any
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    sw.addStateChangeListener(this.m_swOnStateChange)
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  m_reload(): void {
    window.location.reload()
  }

  /**
   * サインインダイアログを表示します。
   */
  m_showSignInDialog(): void {
    this.m_signInDialog.open()
  }

  /**
   * サインアウトを行います。
   */
  async m_signOut(): Promise<void> {
    await this.$stores.auth.signOut()
  }

  /**
   * メールアドレス変更ダイアログを表示します。
   */
  m_showEmailChangeDialog(): void {
    this.m_emailChangeDialog.open()
  }

  /**
   * ユーザーアカウントを削除します。
   */
  async m_deleteAccount(): Promise<void> {
    await this.$stores.auth.deleteAccount()
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
    this.m_swUpdateIsRequired = false

    if (info.state === sw.ChangeState.updated) {
      this.m_swUpdateIsRequired = true
      this.m_swMessage = info.message
      this.$nextTick(() => this.m_swToast.open())
    } else if (info.state === sw.ChangeState.cached) {
      this.m_swMessage = info.message
      this.$nextTick(() => this.m_swToast.open())
    }

    if (info.state === sw.ChangeState.error) {
      console.error(info.message)
    } else {
      // tslint:disable-next-line
      console.log('Service Worker:\n', info)
    }
  }

  /**
   * システムメニューで選択が行われた際のハンドラです。
   */
  async m_menuOnIronSelect(e: CustomEvent) {
    const selectedItemItem = e.detail.item
    this.m_systemMenuList.selected = -1
    if (selectedItemItem === this.m_signInItem) {
      this.m_showSignInDialog()
    } else if (selectedItemItem === this.m_signOutItem) {
      await this.m_signOut()
    } else if (selectedItemItem === this.m_changeEmailItem) {
      await this.m_showEmailChangeDialog()
    } else if (selectedItemItem === this.m_deleteAccountItem) {
      await this.m_deleteAccount()
    }
  }
}
</script>

<i18n>
en:
  reload: "Reload"
ja:
  reload: "再読み込み"
</i18n>
