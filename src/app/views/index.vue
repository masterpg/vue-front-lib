<style lang="stylus" scoped>
  app-drawer-layout {
    --app-drawer-width: 350px;
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
    margin: var(--app-spacer-3) 0;
    .item {
      display: block;
      padding: 0 var(--app-spacer-3);
      text-decoration: none;
      color: var(--app-link-color);
      line-height: 50px;
    }

    .item.router-link-active {
      color: var(--app-primary-text-color);
      font-weight: bold;
    }
  }
</style>


<template>
  <app-drawer-layout>

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
          <router-link :to="item.path" class="item">{{item.title}}</router-link>
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

  @Component
  export default class AppView extends mixins(ElementComponent) {

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    private page: string = '';

    private narrow: boolean = false;

    private items: Array<{ title: string, path: string }> = [
      {
        title: 'ABC',
        path: '/abc',
      },
      {
        title: 'Shopping',
        path: '/shopping',
      },
    ];

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
    //  Event handlers
    //
    //----------------------------------------------------------------------

    private swOnStateChange(info: sw.StateChangeInfo) {
      // tslint:disable-next-line
      console.log(info);
    }
  }
</script>
