import { Quasar } from 'quasar'
import Vue from 'vue'
import { quasar } from '@/lib'

//========================================================================
//
//  Implementation
//
//========================================================================

Vue.use(Quasar, {
  components: {
    ...quasar.components,
  },
  config: {
    ...quasar.config,
  },
  directives: {
    ...quasar.directives,
  },
  plugins: {
    ...quasar.plugins,
  },
})
