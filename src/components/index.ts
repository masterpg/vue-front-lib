import Vue from 'vue';

/**
 * Vueコンポーネントの基底クラスです。
 */
export class VueComponent extends Vue {
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
