import { Component } from 'vue-property-decorator'
import Vue from 'vue'

/**
 * コンポーネントの基底クラスです。
 */
@Component
export class BaseComponent extends Vue {
  /**
   * TestCafeによるテストでエレメントを特定するために使用するIDを生成します。
   * @param id
   */
  tid(id: string): string {
    // 例: "vue-component-87-MyPage"
    const prefix = this.$vnode.tag
    // 例: "vue-component-87-MyPage-messageInput"
    return `${prefix}-${id}`
  }
}
