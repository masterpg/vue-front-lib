<style lang="stylus" scoped>
  @import '../../assets/styles/_typography.styl';

  app-drawer-layout {
    --app-drawer-width: 256px;
    &:not([narrow]) [drawer-toggle] {
      display: none;
    }
  }

  .drawer-toolbar {
  }

  .content-toolbar {
    background-color: var(--paper-indigo-a200);
    color: #fff;
  }

  .drawer-list {
    .item {
      display: block;
      padding: var(--app-spacer-2) var(--app-spacer-5);
      @extend .app-font-code1;
      color: var(--app-secondary-text-color);
      text-decoration none;
    }

    .item.router-link-active {
      color: var(--app-accent-text-color);
    }
  }

  .link-button {
    color: var(--app-link-color);
  }
</style>


<template>
  <div>

    <app-drawer-layout responsive-width="960px">

      <!--
        Drawer content
      -->
      <app-drawer ref="drawer" slot="drawer" :swipe-open="narrow">
        <app-toolbar class="drawer-toolbar">
          <iron-icon src="assets/images/manifest/icon-48x48.png"></iron-icon>
          <div main-title class="app-ml-2">Vue WWW Base</div>
        </app-toolbar>
        <div class="drawer-list">
          <template v-for="item in items">
            <router-link :to="item.path" class="item">{{ item.title }}</router-link>
          </template>
        </div>
      </app-drawer>

      <!--
        Main content
      -->
      <app-toolbar class="content-toolbar">
        <paper-icon-button icon="menu" drawer-toggle></paper-icon-button>
        <div main-title>View name</div>
      </app-toolbar>

      <router-view/>

    </app-drawer-layout>

    <paper-toast ref="swToast" :duration="swUpdateIsRequired ? 0 : 5000" :text="swMessage">
      <paper-button
        v-show="swUpdateIsRequired"
        class="link-button"
        @click="reload"
      >再読み込み
      </paper-button>
    </paper-toast>

  </div>
</template>


<script lang="ts">
import * as sw from '../service-worker';
import { Component } from 'vue-property-decorator';
import { ElementComponent } from '../components';
import { mixins } from 'vue-class-component';

import '@polymer/app-layout/app-drawer-layout/app-drawer-layout';
import '@polymer/app-layout/app-drawer/app-drawer';
import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-header/app-header';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-icon/iron-icon';
import '@polymer/iron-icons/iron-icons';
import '@polymer/iron-pages/iron-pages';
import '@polymer/iron-selector/iron-selector';
import '@polymer/paper-button/paper-button';
import '@polymer/paper-icon-button/paper-icon-button';
import '@polymer/paper-toast/paper-toast';

@Component
export default class AppView extends mixins(ElementComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private page: string = '';

  private narrow: boolean = false;

  private items: Array<{ title: string; path: string }> = [
    {
      title: 'ABC',
      path: '/abc',
    },
    {
      title: 'Shopping',
      path: '/shopping',
    },
  ];

  private swMessage: string = '';

  private swUpdateIsRequired: boolean = false;

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  private get swToast(): { open: () => void } {
    return this.$refs.swToast as any;
  }

  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  created() {
    sw.addStateChangeListener(this.swOnStateChange);
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private reload(): void {
    window.location.reload();
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  private swOnStateChange(info: sw.StateChangeInfo) {
    this.swMessage = info.message;
    this.swUpdateIsRequired = info.state === sw.ChangeState.updateIsRequired;
    this.$nextTick(() => this.swToast.open());

    // tslint:disable-next-line
    console.log(info);
  }
}
</script>
