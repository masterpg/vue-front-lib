<style lang="stylus" scoped>
  .vuetify-icon {
    width: 24px;
    height: 24px;
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
      <img src="assets/images/v-alt.svg" class="vuetify-icon">
    </v-toolbar>
    <v-content>
      <router-view/>
    </v-content>

    <v-snackbar
      :timeout="10000"
      color="info"
      :bottom="true"
      :right="true"
      :multi-line="true"
      v-model="snackbarShow"
    >
      {{ snackbarMessage }}
      <v-btn flat @click.native="snackbarShow = false">Close</v-btn>
    </v-snackbar>
  </v-app>
</template>

<script lang="ts">
  import * as sw from '../app/service-worker';
  import { Component } from 'vue-property-decorator';
  import { VueComponent } from '../components';

  @Component
  export default class AppView extends VueComponent {
    private clipped = false;
    private drawer = true;
    private fixed = false;
    private miniVariant = false;
    private snackbarShow = false;
    private snackbarMessage: string = '';

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

    private created() {
      sw.addStateChangeListener(this.swOnStateChange);
    }

    private swOnStateChange(info: sw.StateChangeInfo) {
      // tslint:disable-next-line
      console.log(info);

      this.snackbarMessage = info.message;
      this.snackbarShow = true;
    }
  }
</script>
