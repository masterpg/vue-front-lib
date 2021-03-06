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

  .expansion-item
    color: $text-primary-bold-color
    font-weight: $text-weight-bold

    .selected-item
      color: $pink-5
</style>

<template>
  <q-layout id="app" class="AppMainPage" view="lHh Lpr lff">
    <q-header reveal elevated class="glossy header">
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

    <q-drawer v-model="leftDrawerOpen" :width="300" :breakpoint="1440" bordered content-class="bg-grey-2">
      <q-scroll-area class="drawer-scroll-area">
        <!-- Article Browser -->
        <q-expansion-item
          v-model="isArticleBrowserExpanded"
          class="expansion-item"
          icon="fas fa-newspaper"
          :label="t('index.mainMenu.articleBrowser')"
          expand-separator
        >
          <AppMainArticleTreeView ref="articleTreeView" />
        </q-expansion-item>

        <!-- Site Admin -->
        <q-expansion-item
          v-show="isSignedIn"
          v-model="isSiteAdminExpanded"
          class="expansion-item"
          icon="fas fa-user-cog"
          :label="t('index.mainMenu.siteAdmin')"
          expand-separator
        >
          <q-list padding>
            <template v-for="(item, index) in siteAdminItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" active-class="selected-item" clickable>
                <q-item-section>{{ item.title }}, {{ item.path }}</q-item-section>
              </q-item>
            </template>
          </q-list>
        </q-expansion-item>

        <!-- App Admin -->
        <q-expansion-item
          v-show="isSignedIn && user.isAppAdmin"
          v-model="isAppAdminExpanded"
          class="expansion-item"
          icon="fas fa-cog"
          :label="t('index.mainMenu.appAdmin')"
          expand-separator
        >
          <q-list padding>
            <template v-for="(item, index) in appAdminItems">
              <q-item :key="index" v-ripple :to="item.path" class="app-ml-20" active-class="selected-item" clickable>
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
import { computed, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import { useRoute, useRouteParams, useRoutes } from '@/app/router'
import { AppMainArticleTreeView } from '@/app/views/main/app-main-article-tree-view.vue'
import { Dialogs } from '@/app/dialogs'
import { Notify } from 'quasar'
import { Screen } from 'quasar'
import { useI18n } from '@/app/i18n'
import { useService } from '@/app/services'
import { useServiceWorker } from '@/app/service-worker'

export default defineComponent({
  components: {
    Dialogs: Dialogs.clazz,
    AppMainArticleTreeView: AppMainArticleTreeView.clazz,
  },

  setup() {
    //----------------------------------------------------------------------
    //
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    onMounted(async () => {
      if (routeParams.userName) {
        await articleTreeView.value!.load(routeParams.userName)
      } else {
        // TODO URLにユーザー名がない場合はNotFoundページへ遷移
      }
    })

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const services = useService()
    const serviceWorker = useServiceWorker()
    const i18n = useI18n()
    const routes = useRoutes()
    const route = useRoute()
    const routeParams = useRouteParams()

    const dialogsRef = ref<Dialogs>()
    Dialogs.provide(dialogsRef)
    const articleTreeView = ref<AppMainArticleTreeView>()

    const leftDrawerOpen = ref(Screen.gt.md ? true : false)
    const isArticleBrowserExpanded = ref(true)
    const isSiteAdminExpanded = ref(true)
    const isAppAdminExpanded = ref(true)
    const isSignedIn = services.auth.isSignedIn
    const isSigningIn = services.auth.isSigningIn
    const isNotSigningIn = services.auth.isNotSignedIn
    const user = computed(() => services.auth.user)

    const siteAdminItems = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: String(i18n.t('index.mainMenu.articleAdmin')),
          path: routes.siteAdmin.article.basePath,
        },
        {
          title: String(i18n.t('index.mainMenu.userStorageAdmin')),
          path: routes.siteAdmin.storage.basePath,
        },
      ]
    })

    const appAdminItems = computed<{ title: string; path: string }[]>(() => {
      return [
        {
          title: String(i18n.t('index.mainMenu.appStorageAdmin')),
          path: routes.appAdmin.storage.basePath,
        },
      ]
    })

    //----------------------------------------------------------------------
    //
    //  Event listeners
    //
    //----------------------------------------------------------------------

    watch(
      () => route.path,
      (newValue, oldValue) => {
        console.log(newValue)
      }
    )

    watch(
      () => routeParams.userName,
      (newValue, oldValue) => {
        newValue && articleTreeView.value!.load(newValue)
      }
    )

    watch(
      () => services.auth.signInStatus.value,
      (newValue, oldValue) => {
        if (newValue === 'None') {
          const needSignedIn = [routes.siteAdmin.article, routes.siteAdmin.storage, routes.appAdmin.storage].some(route => route.isCurrent)
          if (needSignedIn) {
            routes.home.move()
          }
        }
      },
      { immediate: true }
    )

    watch(
      () => services.auth.authStatus.value,
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
      services.auth.signOut()
    }

    function emailChangeMenuItemOnClick() {
      Dialogs.emailChange.open()
    }

    function userDeleteMenuItemOnClick() {
      Dialogs.userDelete.open()
    }

    serviceWorker.watchState(info => {
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
      articleTreeView,
      leftDrawerOpen,
      isArticleBrowserExpanded,
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
