import BreakpointMixin from '@/base/component/breakpoint-mixin'
import { Component } from 'vue-property-decorator'
import { NoCache } from '@/base/component/decorators'
import { mixins } from 'vue-class-component'

/**
 * コンポーネントの基底クラスです。
 */
@Component
class BaseComponent extends mixins(BreakpointMixin) {
  protected get pcScreen() {
    return this.breakpoint.xl || this.breakpoint.lg || this.breakpoint.md
  }

  protected get tabScreen() {
    return this.breakpoint.sm
  }

  protected get spScreen() {
    return this.breakpoint.xs
  }
}

/**
 * Mixinのサンプルです。
 * @param superclass
 */
export const SampleMixin = <T extends new (...args: any[]) => {}>(superclass: T) =>
  class extends superclass {
    constructor(...args: any[]) {
      super(args)
    }
  }

export { BaseComponent, NoCache }
