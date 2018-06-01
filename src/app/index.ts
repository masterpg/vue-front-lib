import '../assets/styles/main.styl';
import '../assets/styles/custom-style';
import * as apis from './apis';
import * as config from './config';
import * as stores from './stores';
import * as sw from './service-worker';
import AppView from './views/index.vue';
import Vue from 'vue';
import router from './router';
import { currency } from './currency';

Vue.config.ignoredElements = [
  'app-drawer',
  'app-drawer-layout',
  'app-header',
  'app-header-layout',
  'app-toolbar',
  'iron-icon',
  'iron-icons',
  'iron-pages',
  'iron-selector',
  'paper-button',
  'paper-card',
  'paper-checkbox',
  'paper-icon-button',
  'paper-input',
];

config.init();
sw.init();
apis.init();
stores.init();

Vue.filter('currency', currency);

new Vue({
  el: '#app',
  router,
  render: (h) => h(AppView),
});
