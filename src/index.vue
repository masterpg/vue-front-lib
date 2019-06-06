<style scoped>
@import './styles/placeholder/typography.css';

.header {
  background-color: var(--comm-indigo-500);
}

.container {
  height: 100vh;
}

.drawer-scroll-area {
  height: 100%;
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

<style>
.app-view-drawer-content-class {
  background-color: var(--comm-grey-200);
}
</style>

<template>
  <q-layout view="lHh Lpr lFf" @component-resize.native="m_onComponentResize">
    <q-header elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="m_leftDrawerOpen = !m_leftDrawerOpen" />

        <q-toolbar-title>
          Quasar App XXX
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="m_leftDrawerOpen" :width="300" :breakpoint="500" show-if-above bordered content-class="app-view-drawer-content-class">
      <q-scroll-area class="drawer-scroll-area">
        <q-list padding>
          <template v-for="(item, index) in m_items">
            <q-item :key="index" v-ripple :to="item.path" clickable>
              <q-item-section avatar>
                <q-icon :name="item.icon" />
              </q-item-section>
              <q-item-section>{{ item.title }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="container">
      <transition name="view" mode="out-in" enter-active-class="animated tada faster" leave-active-class="animated bounceOutRight faster">
        <router-view />
      </transition>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import * as sw from '@/base/service-worker'
import { BaseComponent, ResizableMixin } from '@/base/component'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { router } from '@/base/router'

@Component({ name: 'app-view' })
export default class AppView extends mixins(BaseComponent, ResizableMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_items: Array<{ title: string; path: string; icon: string }> = [
    {
      title: 'ABC',
      path: router.pages.abc.path,
      icon: 'inbox',
    },
    {
      title: 'Shopping',
      path: router.pages.shopping.path,
      icon: 'star',
    },
  ]

  private m_leftDrawerOpen: boolean = false

  private m_swUpdateIsRequired: boolean = false

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  private get m_swToast(): { open: () => void } {
    return this.$refs.swToast as any
  }

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
  //  Event handlers
  //
  //----------------------------------------------------------------------

  private m_swOnStateChange(info: sw.StateChangeInfo) {
    this.m_swUpdateIsRequired = false

    let message = ''
    if (info.state === sw.ChangeState.updated) {
      this.m_swUpdateIsRequired = true
      message = info.message
      this.$nextTick(() => this.m_swToast.open())
    } else if (info.state === sw.ChangeState.cached) {
      message = info.message
      this.$nextTick(() => this.m_swToast.open())
    }
    if (message) {
      this.$q.notify({
        icon: 'info',
        position: 'bottom-left',
        timeout: 0,
        message,
        actions: [{ label: this.$t('reload'), color: 'white', handler: () => window.location.reload() }],
      })
    }

    if (info.state === sw.ChangeState.error) {
      console.error(info.message)
    } else {
      console.log('Service Worker:\n', info)
    }
  }

  private m_onComponentResize(e) {
    console.log('app-view:', e)
  }
}
</script>

<i18n>
en:
  reload: "Reload"
ja:
  reload: "再読み込み"
</i18n>
