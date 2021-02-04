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
  <q-layout id="app" class="AppPage" view="lHh Lpr lff">
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
        <q-expansion-item v-model="isSiteAdminExpanded" icon="fas fa-user-cog" :label="t('index.mainMenu.siteAdmin')" expand-separator>
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
          v-show="user.isAppAdmin"
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
import { AuthStatus, injectService, provideService } from '@/app/service'
import { computed, defineComponent, ref, watch } from '@vue/composition-api'
import { injectServiceWorker, provideServiceWorker } from '@/app/service-worker'
import { Dialogs } from '@/app/dialogs'
import { LoadingSpinner } from '@/app/components/loading-spinner'
import { Notify } from 'quasar'
import { Screen } from 'quasar'
import { useI18n } from '@/app/i18n'
import { useViewRoutes } from '@/app/router'

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
    const viewRoutes = useViewRoutes()
    const { t } = useI18n()

    const dialogsRef = ref<Dialogs>()
    Dialogs.provide(dialogsRef)

    const leftDrawerOpen = ref(Screen.gt.md ? true : false)
    const isSiteAdminExpanded = ref(true)
    const isAppAdminExpanded = ref(true)
    const isSignedIn = service.auth.isSignedIn
    const isSigningIn = service.auth.isSigningIn
    const user = computed(() => service.auth.user)

    const siteAdminItems = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: String(t('index.mainMenu.articleAdmin')),
          path: viewRoutes.siteAdmin.article.path.value,
        },
        {
          title: String(t('index.mainMenu.userStorageAdmin')),
          path: viewRoutes.siteAdmin.storage.path.value,
        },
      ]
    })

    const appAdminItems = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: String(t('index.mainMenu.appStorageAdmin')),
          path: viewRoutes.appAdmin.storage.path.value,
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
      dialogsRef,
      leftDrawerOpen,
      isSiteAdminExpanded,
      isAppAdminExpanded,
      isSignedIn,
      isSigningIn,
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
