<style lang="sass" scoped>
@import './styles/app.variables'

.header
  background-color: $indigo-5

  .photo
    width: 32px
    height: 32px
    border-radius: 50%

.menu-list
  min-width: 150px

.container
  height: 100vh

.drawer-scroll-area
  height: 100%

// ----->
/**
 * Animate.cssにある既存のアニメーションをコピーして変更している。
 * コピー元: node_modules/animate.css/animate.css
 */
@keyframes tada
  from
    transform: scale3d(1, 1, 1)

  10%, 20%
    transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)

  30%, 70%
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)

  50%, 80%
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)

  to
    transform: scale3d(1, 1, 1)

.tada
  animation-name: tada
// <-----

// ----->
/**
 * tada と bounceOutRight のアニメーションスピードを調整
 */
.animated.tada.faster
  animation-duration: 700ms

.animated.bounceOutRight.faster
  animation-duration: 700ms
// <-----

/**
 * フェードイン/アウトのサンプル。このアニメーションを有効にするには、下記のコメントを外し、
 * transitionタグの enter-active-class と leave-active-class を削除るとこのアニメーションが有効になる。
 */
//.view-enter-active, .view-leave-active
//  transition: opacity 0.2s ease
//
//.view-enter, .view-leave-to
//  opacity: 0
</style>

<template>
  <q-layout view="lHh Lpr lFf" @component-resize.native="m_onComponentResize">
    <q-header elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="m_leftDrawerOpen = !m_leftDrawerOpen" />

        <q-toolbar-title>
          Quasar App
        </q-toolbar-title>

        <div class="app-mr-16">Quasar v{{ $q.version }}</div>

        <q-img v-show="m_user.isSignedIn && !!m_user.photoURL" :src="m_user.photoURL" contain class="photo app-mr-6"></q-img>
        <q-icon v-show="m_user.isSignedIn && !m_user.photoURL" name="person" size="26px" class=" app-mr-6"></q-icon>
        <q-btn flat round dense color="white" icon="more_vert">
          <q-menu>
            <q-list class="menu-list">
              <q-item v-show="!m_user.isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_signInMenuItemOnClick">Sign in</q-item-section>
              </q-item>
              <q-item v-show="m_user.isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_signOutMenuItemOnClick">Sign out</q-item-section>
              </q-item>
              <q-item v-show="m_user.isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_changeEmailMenuItemOnClick">Change email</q-item-section>
              </q-item>
              <q-item v-show="m_user.isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_deleteAccountMenuItemOnClick">Delete account</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="m_leftDrawerOpen" :width="300" :breakpoint="500" show-if-above bordered content-class="bg-grey-2">
      <q-scroll-area class="drawer-scroll-area">
        <!-- Demo -->
        <q-expansion-item v-model="m_demoExpanded" icon="star" label="Demo" expand-separator>
          <q-list padding>
            <template v-for="(item, index) in m_demoItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>
        <!-- Components -->
        <q-expansion-item v-model="m_componentsExpanded" icon="fas fa-cubes" label="Components" expand-separator>
          <q-list padding>
            <template v-for="(item, index) in m_componentsItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="container">
      <transition name="view" mode="out-in" enter-active-class="animated tada faster" leave-active-class="animated bounceOutRight faster">
        <router-view />
      </transition>
    </q-page-container>

    <history-dialog-manager ref="historyDialogManager" />
  </q-layout>
</template>

<script lang="ts">
import { BaseComponent, NoCache, Resizable, SWChangeState, SWStateChangeInfo, User } from '@/lib'
import { EmailChangeDialog, HistoryDialogManager, SignInDialog } from '@/example/components'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'
import { sw } from '@/example/sw'

@Component({
  components: {
    HistoryDialogManager,
  },
})
export default class AppPage extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  async created() {
    sw.addStateChangeListener(this.m_swOnStateChange)

    this.m_leftDrawerOpen = this.$q.platform.is.desktop

    await this.$logic.shop.pullProducts()
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_demoExpanded: boolean = true

  private m_demoItems: Array<{ title: string; path: string; icon?: string }> = [
    {
      title: 'ABC',
      path: router.views.demo.abc.path,
    },
    {
      title: 'Shop',
      path: router.views.demo.shop.path,
    },
    {
      title: 'Cloud Storage',
      path: router.views.demo.storage.path,
    },
  ]

  private m_componentsExpanded: boolean = true

  private m_componentsItems: Array<{ title: string; path: string }> = [
    {
      title: 'Tree View',
      path: router.views.components.treeView.path,
    },
  ]

  private m_leftDrawerOpen: boolean = false

  private m_swUpdateIsRequired: boolean = false

  private get m_user(): User {
    const user = this.$logic.auth.user
    if (user.isSignedIn) {
      this.$logic.shop.pullCartItems()
    }
    return user
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_historyDialogManager(): HistoryDialogManager {
    return this.$refs.historyDialogManager as any
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * サインアウトを行います。
   */
  private async m_signOut(): Promise<void> {
    await this.$logic.auth.signOut()
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_swOnStateChange(info: SWStateChangeInfo) {
    this.m_swUpdateIsRequired = false

    if (info.state === SWChangeState.updated) {
      this.$q.notify({
        icon: 'info',
        position: 'bottom-left',
        message: info.message,
        actions: [
          {
            label: this.$t('reload'),
            color: 'white',
            handler: () => window.location.reload(),
          },
        ],
        timeout: 0,
      })
    } else if (info.state === SWChangeState.cached) {
      this.$q.notify({
        icon: 'info',
        position: 'bottom-left',
        message: info.message,
        timeout: 3000,
      })
    }

    if (info.state === SWChangeState.error) {
      console.error(info.message)
    } else {
      console.log('Service Worker:\n', info)
    }
  }

  private m_onComponentResize(e) {
    console.log('app-view:', e)
  }

  private async m_signOutMenuItemOnClick() {
    await this.m_signOut()
  }

  private m_signInMenuItemOnClick() {
    this.m_historyDialogManager.open(SignInDialog.name)
  }

  private m_changeEmailMenuItemOnClick() {
    this.m_historyDialogManager.open(EmailChangeDialog.name)
  }

  private async m_deleteAccountMenuItemOnClick() {}
}
</script>

<i18n>
en:
  reload: "Reload"
ja:
  reload: "再読み込み"
</i18n>
