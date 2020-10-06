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

.page
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

        <q-img
          v-if="m_isSignedIn && Boolean(m_user.publicProfile.photoURL)"
          :src="m_user.publicProfile.photoURL"
          contain
          class="photo app-mr-6"
        ></q-img>
        <q-icon v-else-if="m_isSignedIn" name="person" size="26px" class="app-mr-6"></q-icon>
        <q-btn flat round dense color="white" icon="more_vert">
          <q-menu>
            <q-list class="menu-list">
              <q-item v-show="!m_isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_signInMenuItemOnClick">{{ $t('common.signIn') }}</q-item-section>
              </q-item>
              <q-item v-show="!m_isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_signUpMenuItemOnClick">{{ $t('common.signUp') }}</q-item-section>
              </q-item>
              <q-item v-show="m_isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_signOutMenuItemOnClick">{{ $t('common.signOut') }}</q-item-section>
              </q-item>
              <q-item v-show="m_isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_emailChangeMenuItemOnClick">{{ $t('auth.changeEmail') }}</q-item-section>
              </q-item>
              <q-item v-show="m_isSignedIn" v-close-popup clickable>
                <q-item-section @click="m_userDeleteMenuItemOnClick">{{ $t('auth.deleteUser') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="m_leftDrawerOpen"
      :width="300"
      :breakpoint="500"
      show-if-above
      bordered
      content-class="bg-grey-2"
      @show="m_leftDrawerOnShowOrHide"
      @hide="m_leftDrawerOnShowOrHide"
    >
      <q-scroll-area class="drawer-scroll-area">
        <!-- Demo -->
        <q-expansion-item v-model="m_demoExpanded" icon="star" label="Demo" expand-separator>
          <q-list padding>
            <template v-for="(item, index) in m_demoItems">
              <q-item :key="index" v-ripple :to="item.path" :hidden="item.hidden" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>
        <!-- Site Admin -->
        <q-expansion-item v-model="m_siteAdminExpanded" icon="fas fa-cog" :label="$t('index.mainMenu.siteAdmin')" expand-separator>
          <q-list padding>
            <template v-for="(item, index) in m_siteAdminItems">
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

    <q-page-container class="page">
      <transition name="view" mode="out-in" enter-active-class="animated tada faster" leave-active-class="animated bounceOutRight faster">
        <router-view />
      </transition>
    </q-page-container>

    <history-dialog-manager ref="historyDialogManager" />
  </q-layout>
</template>

<script lang="ts">
import { AuthStatus, UserInfo } from '@/lib'
import { BaseComponent, NoCache, Resizable } from '@/example/base'
import { Component, Watch } from 'vue-property-decorator'
import { EmailChange, HistoryDialogManager, SignIn, SignUp, UserDelete, UserEntry, dialogManager, initDialog } from '@/example/dialog'
import { SWChangeState, SWStateChangeInfo, sw } from '@/example/sw'
import { mixins } from 'vue-class-component'
import { router } from '@/example/router'

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

  mounted() {
    initDialog(this.m_historyDialogManager)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_demoExpanded = true

  private get m_demoItems(): Array<{ title: string; path: string; hidden: boolean }> {
    return [
      {
        title: 'ABC',
        path: router.views.demo.abc.path,
        hidden: false,
      },
      {
        title: 'Shop',
        path: router.views.demo.shop.path,
        hidden: false,
      },
      {
        title: 'User Storage',
        path: `${router.views.demo.userStorage.basePath}`,
        hidden: false,
      },
      {
        title: 'App Storage',
        path: `${router.views.demo.appStorage.basePath}`,
        hidden: this.m_user.isAppAdmin ? false : true,
      },
    ]
  }

  private m_siteAdminExpanded = true

  private get m_siteAdminItems(): Array<{ title: string; path: string }> {
    return [
      {
        title: String(this.$t('index.mainMenu.articleAdmin')),
        path: `${router.views.admin.article.basePath}`,
      },
    ]
  }

  private m_componentsExpanded = true

  private m_componentsItems: Array<{ title: string; path: string }> = [
    {
      title: 'Tree View',
      path: router.views.components.treeView.path,
    },
    {
      title: 'Img',
      path: router.views.components.img.path,
    },
    {
      title: 'Markdown',
      path: router.views.components.markdown.path,
    },
    {
      title: 'markdown-it',
      path: router.views.components.markdownIt.path,
    },
  ]

  private m_leftDrawerOpen = false

  private m_swUpdateIsRequired = false

  private get m_isSignedIn(): boolean {
    return this.$logic.auth.isSignedIn
  }

  private get m_user(): UserInfo {
    return this.$logic.auth.user
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

  private m_onComponentResize(e) {}

  private m_leftDrawerOnShowOrHide() {
    this.notifyResize()
  }

  private async m_signOutMenuItemOnClick() {
    await this.m_signOut()
  }

  private m_signUpMenuItemOnClick() {
    dialogManager.open(SignUp.name)
  }

  private m_signInMenuItemOnClick() {
    dialogManager.open(SignIn.name)
  }

  private m_emailChangeMenuItemOnClick() {
    dialogManager.open(EmailChange.name)
  }

  private async m_userDeleteMenuItemOnClick() {
    dialogManager.open(UserDelete.name)
  }

  @Watch('$logic.auth.status')
  private async m_authStatusOnChange(newValue: AuthStatus, oldValue: AuthStatus) {
    if (this.$logic.auth.status === AuthStatus.WaitForEntry) {
      dialogManager.open(UserEntry.name)
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
