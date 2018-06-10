import BreakpointMixin from './breakpoint-mixin';
import cssVarPoly from '../css-var-polyfill';
import { Component } from 'vue-property-decorator';
import { mixins } from 'vue-class-component';

/**
 * エレメントコンポーネントの基底クラスです。
 */
@Component
export class ElementComponent extends mixins(BreakpointMixin) {
  protected get pc() {
    return this.breakpoint.xl || this.breakpoint.lg || this.breakpoint.md;
  }

  protected get tab() {
    return this.breakpoint.sm;
  }

  protected get sp() {
    return this.breakpoint.xs;
  }

  mounted() {
    cssVarPoly.init();
  }
}

/**
 * Mixinのサンプルです。
 * @param superclass
 */
export const SampleMixin = <T extends new (...args: any[]) => {}>(superclass: T) =>
  class extends superclass {
    constructor(...args: any[]) {
      super(args);
    }
  };
