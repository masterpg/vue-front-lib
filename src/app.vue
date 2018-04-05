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

  @Component({})
  export default class App extends Vue {
    private clipped = false;
    private drawer = true;
    private fixed = false;
    private miniVariant = false;

    private items: { icon: string, title: string, path: string }[] = [
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

