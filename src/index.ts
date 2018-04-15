import 'vuetify/dist/vuetify.min.css';
import * as ES6Promise from 'es6-promise';
import App from './app.vue';
import Vue from 'vue';
import router from './router';
import { VuexStore } from './store';
import { currency } from './currency';

ES6Promise.polyfill();

import Vuetify from 'vuetify/es5/components/Vuetify';
import transitions from 'vuetify/es5/components/transitions';
import directives from 'vuetify/es5/directives';

Vue.use(Vuetify, {
  components: {
    transitions,
    directives,
  },
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
  store: VuexStore,
  render: (h) => h(App),
});
