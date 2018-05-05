import '../assets/styles/main.styl';
import * as ES6Promise from 'es6-promise';
import * as apis from './apis';
import * as stores from './stores';
import * as sw from './service-worker';
import AppView from './views/index.vue';
import Vue from 'vue';
import Vuetify from 'vuetify';
import router from './router';
import { currency } from './currency';

ES6Promise.polyfill();
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
