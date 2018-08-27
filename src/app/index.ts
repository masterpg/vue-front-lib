import '../assets/styles/custom-style.js';
import '../assets/styles/main.css';

import * as utils from './base/utils';
import * as config from './base/config';
import * as sw from './base/service-worker';
import router from './router';
import * as apis from './apis';
import * as stores from './stores';
import AppView from './views/index.vue';
import Vue from 'vue';
import { currency } from './currency';

utils.init();
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
