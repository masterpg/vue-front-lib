<style lang="sass">
@import 'src/styles/app.variables'

.header
  background-color: $indigo-5

.menu-list
  min-width: 150px

.page
  height: 100vh

.drawer-scroll-area
  height: 100%
</style>

<template>
  <q-layout id="app" view="lHh Lpr lFf">
    <q-header elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="state.leftDrawerOpen = !state.leftDrawerOpen" />

        <q-toolbar-title>
          Vue2 Composition API
        </q-toolbar-title>

        <div v-show="state.isSignedIn" class="app-mr-16">{{ state.user.displayName }}</div>
        <div class="app-mr-16">Quasar v{{ $q.version }}</div>

        <q-btn flat round dense color="white" icon="more_vert">
          <q-menu>
            <q-list class="menu-list">
              <q-item v-show="!state.isSignedIn" v-close-popup clickable>
                <q-item-section @click="signInMenuItemOnClick">{{ t('common.signIn') }}</q-item-section>
              </q-item>
              <q-item v-show="state.isSignedIn" v-close-popup clickable>
                <q-item-section @click="signOutMenuItemOnClick">{{ t('common.signOut') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="state.leftDrawerOpen" :width="300" :breakpoint="500" show-if-above bordered content-class="bg-grey-2">
      <q-scroll-area class="drawer-scroll-area">
        <q-list padding>
          <template v-for="(item, index) in state.pages">
            <q-item :key="index" v-ripple :to="item.path" clickable>
              <q-item-section>{{ item.title }}</q-item-section>
            </q-item>
          </template>
        </q-list>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="page">
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent, reactive } from '@vue/composition-api'
import { injectLogic, provideLogic } from '@/logic'
import { injectServiceWorker, provideServiceWorker } from '@/service-worker'
import { Notify } from 'quasar'
import { Platform } from 'quasar'
import { provideConfig } from '@/config'
import { useI18n } from '@/i18n'

export default defineComponent({
  setup() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    provideConfig()
    provideLogic()
    provideServiceWorker()

    const logic = injectLogic()
    const serviceWorker = injectServiceWorker()
    const { t } = useI18n()

    const state = reactive({
      leftDrawerOpen: Platform.is.desktop,

      pages: [
        {
          title: 'Home',
          path: '/home',
        },
        {
          title: 'ABC',
          path: '/abc',
        },
        {
          title: 'Shop',
          path: '/shop',
        },
        {
          title: 'TreeView',
          path: '/tree',
        },
      ] as { title: string; path: string }[],

      isSignedIn: logic.auth.isSignedIn,

      user: logic.auth.user,
    })

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    function signInMenuItemOnClick() {
      logic.auth.signIn()
    }

    function signOutMenuItemOnClick() {
      logic.auth.signOut()
    }

    serviceWorker.addStateChangeListener(info => {
      if (info.state === 'updated') {
        Notify.create({
          icon: 'info',
          position: 'bottom-left',
          message: String(t('app.updated')),
          actions: [
            {
              label: t('common.reload'),
              color: 'white',
              handler: () => {
                window.location.reload()
              },
            },
          ],
          timeout: 0,
        })
      }

      if (info.state === 'error') {
        console.error(info.message)
      } else {
        console.log('ServiceWorker:', JSON.stringify(info, null, 2))
      }
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      t,
      state,
      signInMenuItemOnClick,
      signOutMenuItemOnClick,
    }
  },
})
</script>
