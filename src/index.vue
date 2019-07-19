<style lang="stylus" scoped>
@import './styles/app.variables.styl'

.header {
  background-color: $indigo-5
}

.container {
  height: 100vh
}

.drawer-scroll-area {
  height: 100%
}

/* -----> */
/**
 * Animate.cssにある既存のアニメーションをコピーして変更している。
 * コピー元: node_modules/animate.css/animate.css
 */
@keyframes tada {
  from {
    transform: scale3d(1, 1, 1)
  }
  10%,
  20% {
    transform: scale3d(0.9, 0.9, 0.9) rotate3d(0, 0, 1, -3deg)
  }
  30%,
  70% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, 3deg)
  }
  50%,
  80% {
    transform: scale3d(1.1, 1.1, 1.1) rotate3d(0, 0, 1, -3deg)
  }
  to {
    transform: scale3d(1, 1, 1)
  }
}

.tada {
  animation-name: tada
}
/* <----- */

/* -----> */
/**
 * tada と bounceOutRight のアニメーションスピードを調整
 */
.animated.tada.faster {
  animation-duration: 700ms
}

.animated.bounceOutRight.faster {
  animation-duration: 700ms
}
/* <----- */

/**
 * フェードイン/アウトのサンプル。このアニメーションを有効にするには、下記のコメントを外し、
 * transitionタグの enter-active-class と leave-active-class を削除るとこのアニメーションが有効になる。
 */
/*
.view-enter-active,
.view-leave-active {
  transition: opacity 0.2s ease
}
.view-enter,
.view-leave-to {
  opacity: 0
}
*/
</style>

<template>
  <q-layout view="lHh Lpr lFf" @component-resize.native="m_onComponentResize">
    <q-header elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="m_leftDrawerOpen = !m_leftDrawerOpen" />

        <q-toolbar-title>
          Quasar App
        </q-toolbar-title>

        <div>Quasar v{{ $q.version }}</div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="m_leftDrawerOpen" :width="300" :breakpoint="500" show-if-above bordered content-class="bg-grey-2">
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
        <q-expansion-item icon="code" label="Demo">
          <q-list padding>
            <template v-for="(item, index) in m_demoItems">
              <q-item :key="index" v-ripple :to="item.path" clickable class="app-ml-20">
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
  </q-layout>
</template>

<script lang="ts">
import * as sw from '@/base/service-worker'
import { BaseComponent, ResizableMixin } from '@/components'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'
import { router } from '@/base/router'

@Component({ name: 'app-page' })
export default class AppPage extends mixins(BaseComponent, ResizableMixin) {
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

  private m_items: Array<{ title: string; path: string; icon: string }> = [
    {
      title: 'ABC',
      path: router.views.abcPage.path,
      icon: 'inbox',
    },
    {
      title: 'Shopping',
      path: router.views.shoppingPage.path,
      icon: 'star',
    },
  ]

  private m_demoItems: Array<{ title: string; path: string }> = [
    {
      title: 'comp-tree-view',
      path: router.views.demo.compTreeViewPage.path,
    },
  ]

  private m_leftDrawerOpen: boolean = false

  private m_swUpdateIsRequired: boolean = false

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_swOnStateChange(info: sw.StateChangeInfo) {
    this.m_swUpdateIsRequired = false

    if (info.state === sw.ChangeState.updated) {
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
    } else if (info.state === sw.ChangeState.cached) {
      this.$q.notify({
        icon: 'info',
        position: 'bottom-left',
        message: info.message,
        timeout: 3000,
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
