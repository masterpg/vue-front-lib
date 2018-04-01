import Vue from 'vue';
import App from './app.vue';
import { VuexStore } from './store';
import { currency } from './currency';

Vue.filter('currency', currency);

new Vue({
  el: '#app',
  store: VuexStore,
  render: h => h(App),
});
