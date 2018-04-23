import Vue from 'vue';

/**
 * Vueコンポーネントの基底クラスです。
 */
class VueComponent extends Vue {
}

/**
 * Vueコンポーネントの基底クラスのMixinです。
 * @param superclass
 */
const VueComponentMixin = <T extends new (...args: any[]) => {}>(superclass: T) => class extends superclass {
  constructor(...args: any[]) {
    super(args);
  }
};

export { VueComponent, VueComponentMixin };
