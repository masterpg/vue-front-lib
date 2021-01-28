<style lang="sass">
@import 'src/app/styles/app.variables'

.AppPage

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
  <q-layout id="app" class="AppPage" view="lHh Lpr lFf">
    <q-header elevated class="glossy header">
      <q-toolbar>
        <q-btn flat dense round aria-label="Menu" icon="menu" @click="state.leftDrawerOpen = !state.leftDrawerOpen" />

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

    <q-drawer v-model="state.leftDrawerOpen" :width="300" :breakpoint="500" show-if-above bordered content-class="bg-grey-2">
      <q-scroll-area class="drawer-scroll-area">
        <!-- Site Admin -->
        <q-expansion-item v-model="state.isSiteAdminExpanded" icon="fas fa-user-cog" :label="t('index.mainMenu.siteAdmin')" expand-separator>
          <q-list padding>
            <template v-for="(item, index) in state.siteAdminItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>
        <!-- App Admin -->
        <q-expansion-item
          v-show="user.isAppAdmin"
          v-model="state.isAppAdminExpanded"
          icon="fas fa-cog"
          :label="t('index.mainMenu.appAdmin')"
          expand-separator
        >
          <q-list padding>
            <template v-for="(item, index) in state.appAdminItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" clickable>
                <q-item-section>{{ item.title }}</q-item-section>
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
import { AuthStatus, injectService, provideService } from '@/app/service'
import { Notify, Platform } from 'quasar'
import { defineComponent, reactive, ref, watch } from '@vue/composition-api'
import { injectServiceWorker, provideServiceWorker } from '@/app/service-worker'
import { Dialogs } from '@/app/dialogs'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import router from '@/app/router'
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
    const { t } = useI18n()

    const dialogsRef = ref<Dialogs>()
    Dialogs.provide(dialogsRef)

    const state = reactive({
      leftDrawerOpen: Platform.is.desktop,

      siteAdminItems: [
        {
          title: String(t('index.mainMenu.articleAdmin')),
          path: router.views.siteAdmin.article.getPath(),
        },
        {
          title: String(t('index.mainMenu.userStorageAdmin')),
          path: router.views.siteAdmin.storage.getPath(),
        },
      ] as { title: string; path: string }[],

      isSiteAdminExpanded: true,

      appAdminItems: [
        {
          title: String(t('index.mainMenu.appStorageAdmin')),
          path: router.views.appAdmin.storage.getPath(),
        },
      ] as { title: string; path: string }[],

      isAppAdminExpanded: true,
    })

    const isSignedIn = service.auth.isSignedIn
    const isSigningIn = service.auth.isSigningIn

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
      service.auth.signOut()
    }

    function emailChangeMenuItemOnClick() {
      Dialogs.emailChange.open()
    }

    function userDeleteMenuItemOnClick() {
      Dialogs.userDelete.open()
    }

    watch(
      () => service.auth.status.value,
      (newValue, oldValue) => {
        if (newValue === AuthStatus.WaitForEntry) {
          Dialogs.userEntry.open()
        }
      }
    )

    serviceWorker.addStateChangeListener(info => {
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
      state,
      dialogsRef,
      user: service.auth.user,
      isSignedIn,
      isSigningIn,
      signInMenuItemOnClick,
      signUpMenuItemOnClick,
      signOutMenuItemOnClick,
      emailChangeMenuItemOnClick,
      userDeleteMenuItemOnClick,
    }
  },
})
</script>
