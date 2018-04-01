import Vue from 'vue';
import App from './app.vue';
import { VuexStore } from './store';
import { currency } from './currency';

import * as ES6Promise from "es6-promise";
ES6Promise.polyfill();

Vue.filter('currency', currency);

new Vue({
  el: '#app',
  store: VuexStore,
  render: h => h(App),
});
