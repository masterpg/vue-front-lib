<style lang="scss">
  .host {
  }
</style>

<template>
  <v-app>
    <v-navigation-drawer
      persistent
      :mini-variant="miniVariant"
      :clipped="clipped"
      v-model="drawer"
      enable-resize-watcher
      fixed
      app
    >
      <v-list>
        <v-list-tile
          value="true"
          v-for="(item, i) in items"
          :key="i"
        >
          <v-list-tile-action>
            <v-icon v-html="item.icon"></v-icon>
          </v-list-tile-action>
          <v-list-tile-content>
            <router-link :to="item.path">{{item.title}}</router-link>
          </v-list-tile-content>
        </v-list-tile>
      </v-list>
    </v-navigation-drawer>
    <v-toolbar
      app
      :clipped-left="clipped"
    >
      <v-toolbar-side-icon @click.stop="drawer = !drawer"></v-toolbar-side-icon>
    </v-toolbar>
    <v-content>
      <router-view/>
    </v-content>
  </v-app>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';

  import Vuetify from 'vuetify/es5/components/Vuetify';
  import VApp from 'vuetify/es5/components/VApp';
  import VGrid from 'vuetify/es5/components/VGrid';
  import VIcon from 'vuetify/es5/components/VIcon';
  import VList from 'vuetify/es5/components/VList';
  import VNavigationDrawer from 'vuetify/es5/components/VNavigationDrawer';
  import VToolbar from 'vuetify/es5/components/VToolbar';

  Vue.use(Vuetify, {
    components: {
      VApp,
      VGrid,
      VIcon,
      VList,
      VNavigationDrawer,
      VToolbar,
    },
  });

  @Component({})
  export default class App extends Vue {
    private clipped = false;
    private drawer = true;
    private fixed = false;
    private miniVariant = false;

    private items: Array<{ icon: string, title: string, path: string }> = [
      {
        icon: 'bubble_chart',
        title: 'ABC',
        path: '/abc',
      },
      {
        icon: 'bubble_chart',
        title: 'Shopping',
        path: '/shopping',
      },
    ];
  }
</script>

