import Vue from 'vue';

/**
 * Vueコンポーネントの基底クラスです。
 */
export class VueComponent extends Vue {
  protected get pc() {
    return this.$vuetify.breakpoint.name === 'xl'
      || this.$vuetify.breakpoint.name === 'lg'
      || this.$vuetify.breakpoint.name === 'md';
  }

  protected get tab() {
    return this.$vuetify.breakpoint.name === 'sm';
  }

  protected get sp() {
    return this.$vuetify.breakpoint.name === 'xs';
  }

  beforeCreated() {}

  created() {}

  beforeMount() {}

  mounted() {}

  beforeUpdate() {}

  updated() {}

  beforeDestroy() {}

  destroyed() {}
}

/**
 * Vueコンポーネントの基底クラスのMixinです。
 * @param superclass
 */
export const VueComponentMixin = <T extends new (...args: any[]) => {}>(superclass: T) => class extends superclass {
  constructor(...args: any[]) {
    super(args);
  }
};
