import '../assets/styles/main.styl';
import '../assets/styles/custom-style';
import * as apis from './apis';
import * as config from './config';
import * as stores from './stores';
import * as sw from './service-worker';
import AppView from './views/index.vue';
import Vue from 'vue';
import Vuetify from 'vuetify';
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

Vue.use(Vuetify, {
  theme: {
    primary: '#ee44aa',
    secondary: '#424242',
    accent: '#82B1FF',
    error: '#FF5252',
    info: '#2196F3',
    success: '#4CAF50',
    warning: '#FFC107',
  },
});

Vue.filter('currency', currency);

new Vue({
  el: '#app',
  router,
  render: (h) => h(AppView),
});
