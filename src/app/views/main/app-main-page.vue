<style lang="sass">
@import 'src/app/styles/app.variables'

.AppMainPage

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
  <q-layout id="app" class="AppMainPage" view="lHh Lpr lff">
    <q-header reveal elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />

        <q-toolbar-title> Vue2 Composition API </q-toolbar-title>

        <div class="app-mr-16">Quasar v{{ $q.version }}</div>

        <LoadingSpinner v-if="isSigningIn" color="indigo-3" />
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

    <q-drawer v-model="leftDrawerOpen" :width="300" :breakpoint="1440" bordered content-class="bg-grey-2">
      <q-scroll-area class="drawer-scroll-area">
        <!-- Site Admin -->
        <q-expansion-item
          v-show="isSignedIn"
          v-model="isSiteAdminExpanded"
          icon="fas fa-user-cog"
          :label="t('index.mainMenu.siteAdmin')"
          expand-separator
        >
          <q-list padding>
            <template v-for="(item, index) in siteAdminItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}, {{ item.path }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>
        <!-- App Admin -->
        <q-expansion-item
          v-show="isSignedIn && user.isAppAdmin"
          v-model="isAppAdminExpanded"
          icon="fas fa-cog"
          :label="t('index.mainMenu.appAdmin')"
          expand-separator
        >
          <q-list padding>
            <template v-for="(item, index) in appAdminItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}, {{ item.path }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>
      </q-scroll-area>
    </q-drawer>

    <q-page-container class="page">
      <router-view />
    </q-page-container>

    <Dialogs ref="dialogsRef" />
  </q-layout>
</template>

<script lang="ts">
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { injectService, provideService } from '@/app/service'
import { injectServiceWorker, provideServiceWorker } from '@/app/service-worker'
import { useRouteParams, useRoutes } from '@/app/router'
import { Dialogs } from '@/app/dialogs'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import { Notify } from 'quasar'
import { Screen } from 'quasar'
import { useI18n } from '@/app/i18n'

export default defineComponent({
  components: {
    Dialogs: Dialogs.clazz,
    LoadingSpinner: LoadingSpinner.clazz,
  },

  setup() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    provideService()
    provideServiceWorker()

    const service = injectService()
    const serviceWorker = injectServiceWorker()
    const routes = useRoutes()
    const i18n = useI18n()
    const { userName } = useRouteParams()

    const dialogsRef = ref<Dialogs>()
    Dialogs.provide(dialogsRef)

    const leftDrawerOpen = ref(Screen.gt.md ? true : false)
    const isSiteAdminExpanded = ref(true)
    const isAppAdminExpanded = ref(true)
    const isSignedIn = service.auth.isSignedIn
    const isSigningIn = service.auth.isSigningIn
    const isNotSigningIn = service.auth.isNotSignedIn
    const user = computed(() => service.auth.user)

    const siteAdminItems = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: String(i18n.t('index.mainMenu.articleAdmin')),
          path: routes.siteAdmin.article.path.value,
        },
        {
          title: String(i18n.t('index.mainMenu.userStorageAdmin')),
          path: routes.siteAdmin.storage.path.value,
        },
      ]
    })

    const appAdminItems = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: String(i18n.t('index.mainMenu.appStorageAdmin')),
          path: routes.appAdmin.storage.path.value,
        },
      ]
    })

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => service.auth.signInStatus.value,
      (newValue, oldValue) => {
        if (newValue === 'None') {
          const needSignedIn = [routes.siteAdmin.article, routes.siteAdmin.storage, routes.appAdmin.storage].some(page => page.isCurrent.value)
          if (needSignedIn) {
            routes.home.move()
          }
        }
      },
      { immediate: true }
    )

    watch(
      () => service.auth.authStatus.value,
      (newValue, oldValue) => {
        if (newValue === 'WaitForEntry') {
          Dialogs.userEntry.open()
        }
      }
    )

    function signInMenuItemOnClick() {
      Dialogs.signIn.open()
    }

    function signUpMenuItemOnClick() {
      Dialogs.signUp.open()
    }

    function signOutMenuItemOnClick() {
      service.auth.signOut()
    }

    function emailChangeMenuItemOnClick() {
      Dialogs.emailChange.open()
    }

    function userDeleteMenuItemOnClick() {
      Dialogs.userDelete.open()
    }

    serviceWorker.addStateChangeListener(info => {
      if (info.state === 'updated') {
        Notify.create({
          icon: 'info',
          position: 'bottom-left',
          message: String(i18n.t('index.updated')),
          actions: [
            {
              label: i18n.t('common.reload'),
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
      ...i18n,
      dialogsRef,
      leftDrawerOpen,
      isSiteAdminExpanded,
      isAppAdminExpanded,
      isSignedIn,
      isSigningIn,
      isNotSigningIn,
      user,
      siteAdminItems,
      appAdminItems,
      signInMenuItemOnClick,
      signUpMenuItemOnClick,
      signOutMenuItemOnClick,
      emailChangeMenuItemOnClick,
      userDeleteMenuItemOnClick,
    }
  },
})
</script>
