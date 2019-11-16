import { Breakpoint } from './breakpoint'
import { Component } from 'vue-property-decorator'

/**
 * 親を持たないResizableのリスト
 */
const ORPHANS = new Set<Resizable>()

@Component
export class Resizable extends Breakpoint {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.$el.addEventListener('iron-request-resize-notifications', this.Resizable_onIronRequestResizeNotifications)
    this.Resizable_isAttached = true
    this.Resizable_requestResizeNotifications()
  }

  destroyed() {
    this.Resizable_isAttached = false

    if (this.Resizable_parentResizable) {
      this.Resizable_parentResizable.stopResizeNotificationsFor(this)
    } else {
      ORPHANS.delete(this)
      window.removeEventListener('resize', this.notifyResize)
    }

    this.Resizable_parentResizable = null
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  /**
   * 自身のコンポーネントがアタッチされているかを示すフラグ
   */
  private Resizable_isAttached: boolean = false

  /**
   * 子孫へのリサイズ通知が実行されているかを示すフラグ
   */
  private Resizable_notifyingDescendant: boolean = false

  /**
   * 自身からみて子孫となるResizableのリスト
   */
  private Resizable_interestedResizables: Resizable[] = []

  private Resizable_parentResizableValue: Resizable | null = null

  private get Resizable_parentResizable(): Resizable | null {
    return this.Resizable_parentResizableValue
  }

  private set Resizable_parentResizable(value: Resizable | null) {
    if (this.Resizable_parentResizableValue === value) return
    this.Resizable_parentResizableValue = value
    if (this.Resizable_parentResizableValue) {
      window.removeEventListener('resize', this.notifyResize)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * Resizableなコンポーネントにリサイズ通知を行います。
   */
  notifyResize(): void {
    if (!this.Resizable_isAttached) {
      return
    }

    this.Resizable_interestedResizables.forEach(resizable => {
      if (this.resizerShouldNotify(resizable)) {
        this.Resizable_notifyDescendant(resizable)
      }
    })

    this.Breakpoint_windowOnResize()

    this.Resizable_fireResize()
  }

  /**
   * 自身と最も近いResizableな祖先との関連付けを行います。
   * @param parentResizable
   */
  assignParentResizable(parentResizable?: Resizable): void {
    // 既に親が存在する場合、今の親から自分との関連を削除
    if (this.Resizable_parentResizable) {
      this.Resizable_parentResizable.stopResizeNotificationsFor(this)
    }

    // 新たな親と自分との関連を設定
    this.Resizable_parentResizable = parentResizable as Resizable
    if (this.Resizable_parentResizable && this.Resizable_parentResizable.Resizable_interestedResizables.indexOf(this) === -1) {
      this.Resizable_parentResizable.Resizable_interestedResizables.push(this)
      this.Resizable_parentResizable.Resizable_subscribeIronResize(this)
    }
  }

  /**
   * 自身から指定された子孫を削除し、
   * その子孫に登録されている自身のcomponent-resizeリスナを解除します。
   * @param target
   */
  stopResizeNotificationsFor(target: Resizable): void {
    const index = this.Resizable_interestedResizables.indexOf(target)
    if (index > -1) {
      this.Resizable_interestedResizables.splice(index, 1)
      this.Resizable_unsubscribeIronResize(target)
    }
  }

  /**
   * このメソッドはリサイズ通知を受け取るかを制御するために使用されます。
   * リサイズ通知の受け取りを制御したいコンポーネントはこのメソッドをオーバーライドして下さい。
   * trueを返すとtargetの子孫にリサイズ通知が行われます。
   * falseを返すとtargetの子孫にはリサイズ通知が行われません。
   * @param target リサイズ通知の受け取りの制御対象コンポーネントが渡されます。
   */
  resizerShouldNotify(target: Resizable): boolean {
    return true
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * 自身からみて祖先のResizableとの関連付けを要求/実行します。
   */
  private Resizable_requestResizeNotifications(): void {
    if (!this.Resizable_isAttached) return

    if (document.readyState === 'loading') {
      const requestResizeNotifications = this.Resizable_requestResizeNotifications.bind(this)
      document.addEventListener('readystatechange', function readystatechanged() {
        document.removeEventListener('readystatechange', readystatechanged)
        requestResizeNotifications()
      })
    } else {
      this.Resizable_findParent()

      if (!this.Resizable_parentResizable) {
        // If this resizable is an orphan, tell other orphans to try to find
        // their parent again, in case it's this resizable.
        ORPHANS.forEach(orphan => {
          if (orphan !== this) {
            orphan.Resizable_findParent()
          }
        })

        window.addEventListener('resize', this.notifyResize)
        this.notifyResize()
      } else {
        // If this resizable has a parent, tell other child resizables of
        // that parent to try finding their parent again, in case it's this
        // resizable.
        this.Resizable_parentResizable.Resizable_interestedResizables.forEach(resizable => {
          if (resizable !== this) {
            resizable.Resizable_findParent()
          }
        })
      }
    }
  }

  /**
   * 自身からみて最も近い祖先のResizableを検索し、自身と祖先の関連付けを行います。
   */
  private Resizable_findParent(): void {
    this.assignParentResizable(undefined)

    // 自身と祖先の関連付けを要求するイベントを発火
    this.$el.dispatchEvent(
      new CustomEvent('iron-request-resize-notifications', {
        detail: { component: this },
        bubbles: true,
        cancelable: true,
        composed: true,
      })
    )

    if (!this.Resizable_parentResizable) {
      ORPHANS.add(this)
    } else {
      ORPHANS.delete(this)
    }
  }

  /**
   * 指定されたdescendantの子孫に対して再帰的にリサイズ通知を行います。
   * @param descendant
   */
  private Resizable_notifyDescendant(descendant: Resizable): void {
    // NOTE(cdata): In IE10, attached is fired on children first, so it's
    // important not to notify them if the parent is not attached yet (or
    // else they will get redundantly notified when the parent attaches).
    if (!this.Resizable_isAttached) {
      return
    }

    this.Resizable_notifyingDescendant = true
    descendant.notifyResize()
    this.Resizable_notifyingDescendant = false
  }

  /**
   * component-resizeイベントを発火します。
   */
  Resizable_fireResize(): void {
    this.$el.dispatchEvent(new CustomEvent('component-resize', { bubbles: true, composed: true }))
  }

  /**
   * target上のcomponent-resizeイベントに自身のリスナを登録します。
   * @param target
   */
  private Resizable_subscribeIronResize(target: Resizable): void {
    target.$el.addEventListener('component-resize', this.Resizable_onDescendantIronResize)
  }

  /**
   * target上のcomponent-resizeイベントに登録されている自身のリスナを解除します。
   * @param target
   */
  private Resizable_unsubscribeIronResize(target: Resizable): void {
    target.$el.removeEventListener('component-resize', this.Resizable_onDescendantIronResize)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  /**
   * iron-request-resize-notificationsイベントのリスナです。
   * このイベントは、子孫が祖先との関連付けを必要とした場合発火されます。
   * @param e
   */
  private Resizable_onIronRequestResizeNotifications(e): void {
    const child = (e as CustomEvent<{ component: Resizable }>).detail.component
    if (child === this) {
      return
    }

    // 自分(親)と子(イベントターゲット)を関連付ける
    child.assignParentResizable(this)
    // 自分(親)から子(イベントターゲット)の子孫に対してリサイズを通知
    this.Resizable_notifyDescendant(child)

    e.stopPropagation()
  }

  /**
   * component-resizeイベントのリスナです。
   * @param event
   */
  private Resizable_onDescendantIronResize(event) {
    // 子孫へのリサイズ通知が行われている場合、リサイズイベントはここでストップする
    // (逆に子孫から祖先への通知はストップしてはならない)
    if (this.Resizable_notifyingDescendant) {
      event.stopPropagation()
      return
    }
  }
}
