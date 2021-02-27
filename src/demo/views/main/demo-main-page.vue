<style lang="sass">
@import 'src/app/styles/app.variables'

.DemoMainPage

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
  <q-layout id="app" class="DemoMainPage" view="lHh Lpr lFf">
    <q-header elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title> Vue2 Composition API </q-toolbar-title>

        <div class="app-mr-16">Quasar v{{ $q.version }}</div>

        <q-spinner v-if="isSigningIn" size="20px" color="indigo-3" />
        <div v-show="isSignedIn" class="app-mr-16">{{ user.fullName }}</div>

        <q-btn flat round dense color="white" icon="more_vert">
          <q-menu>
            <q-list class="menu-list">
              <q-item v-show="!isSignedIn" v-close-popup clickable>
                <q-item-section @click="signInMenuItemOnClick">{{ t('common.signIn') }}</q-item-section>
              </q-item>
              <q-item v-show="!isSignedIn" v-close-popup clickable>
                <q-item-section @click="signUpMenuItemOnClick">{{ t('common.signUp') }}</q-item-section>
              </q-item>
              <q-item v-show="isSignedIn" v-close-popup clickable>
                <q-item-section @click="signOutMenuItemOnClick">{{ t('common.signOut') }}</q-item-section>
              </q-item>
              <q-item v-show="isSignedIn" v-close-popup clickable>
                <q-item-section @click="emailChangeMenuItemOnClick">{{ t('auth.changeEmail') }}</q-item-section>
              </q-item>
              <q-item v-show="isSignedIn" v-close-popup clickable>
                <q-item-section @click="userDeleteMenuItemOnClick">{{ t('auth.deleteUser') }}</q-item-section>
              </q-item>
            </q-list>
          </q-menu>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" :width="300" :breakpoint="500" show-if-above bordered content-class="bg-grey-2">
      <q-scroll-area class="drawer-scroll-area">
        <q-list padding>
          <template v-for="(item, index) in pages">
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

    <Dialogs ref="dialogsRef" />
  </q-layout>
</template>

<script lang="ts">
import { Notify, Platform } from 'quasar'
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { Dialogs } from '@/app/dialogs'
import { useI18n } from '@/demo/i18n'
import { useRoutes } from '@/demo/router'
import { useService } from '@/demo/services'
import { useServiceWorker } from '@/app/service-worker'

export default defineComponent({
  components: {
    Dialogs: Dialogs.clazz,
  },

  setup(props, ctx) {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const services = useService()
    const serviceWorker = useServiceWorker()
    const routes = useRoutes()
    const { t } = useI18n()

    const dialogsRef = ref<Dialogs>()
    Dialogs.provide(dialogsRef)

    const leftDrawerOpen = Platform.is.desktop ? ref(true) : ref(false)
    const isSignedIn = services.auth.isSignedIn
    const isSigningIn = services.auth.isSigningIn
    const user = computed(() => services.auth.user)

    const pages = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: 'Home',
          path: routes.home.path.value,
        },
        {
          title: 'ABC',
          path: routes.abc.path.value,
        },
        {
          title: 'Shop',
          path: routes.shop.path.value,
        },
        {
          title: 'TreeView',
          path: routes.tree.path.value,
        },
        {
          title: 'Img',
          path: routes.img.path.value,
        },
        {
          title: 'Markdown',
          path: routes.markdown.path.value,
        },
        {
          title: 'markdown-it',
          path: routes.markdownIt.path.value,
        },
      ]
    })

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    function signInMenuItemOnClick() {
      Dialogs.signIn.open()
    }

    function signUpMenuItemOnClick() {
      Dialogs.signUp.open()
    }

    function signOutMenuItemOnClick() {
      services.auth.signOut()
    }

    function emailChangeMenuItemOnClick() {
      Dialogs.emailChange.open()
    }

    function userDeleteMenuItemOnClick() {
      Dialogs.userDelete.open()
    }

    watch(
      () => services.auth.authStatus.value,
      (newValue, oldValue) => {
        if (newValue === 'WaitForEntry') {
          Dialogs.userEntry.open()
        }
      }
    )

    serviceWorker.watchState(info => {
      if (info.state === 'updated') {
        Notify.create({
          icon: 'info',
          position: 'bottom-left',
          message: String(t('index.updated')),
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
      dialogsRef,
      leftDrawerOpen,
      isSignedIn,
      isSigningIn,
      user,
      pages,
      signInMenuItemOnClick,
      signUpMenuItemOnClick,
      signOutMenuItemOnClick,
      emailChangeMenuItemOnClick,
      userDeleteMenuItemOnClick,
    }
  },
})
</script>
