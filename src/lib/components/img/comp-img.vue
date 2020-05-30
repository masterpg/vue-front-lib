<style lang="sass" scoped>
@import 'src/lib/styles/lib.variables'

.com-img-main
  box-sizing: border-box
  position: relative

.img-tag
  max-width: var(--comp-img-max-width, 100%)
  max-height: var(--comp-img-max-height, 100%)

.spinner-container
  width: 100%
  height: 100%
  top: 0
  left: 0
  position: absolute

  .spinner
    position: relative
    display: inline-block
    width: 20px
    height: 20px
    border: 2px solid #0cf
    border-radius: 50%
    animation: spin 0.75s infinite linear

  .spinner::before,
  .spinner::after
    left: -2px
    top: -2px
    display: none
    position: absolute
    content: ''
    width: inherit
    height: inherit
    border: inherit
    border-radius: inherit

  .spinner-type-one,
  .spinner-type-one::before
    display: inline-block
    border-color: transparent
    border-top-color: $grey-6

  .spinner-type-one::before
    animation: spin 1.5s infinite ease

@keyframes spin
  from
    transform: rotate(0deg)
  to
    transform: rotate(360deg)
</style>

<template>
  <div ref="container" class="com-img-main layout horizontal" @component-resize="m_onComponentResize">
    <div ref="spinnerContainer" class="spinner-container layout vertical center-center" hidden>
      <div style="height: 20px"><div class="spinner spinner-type-one" /></div>
    </div>
    <img ref="img" :src="src" :alt="alt" h-align="center" class="img-tag" @load="imgOnLoad" />
  </div>
</template>

<script lang="ts">
import * as anime from 'animejs/lib/anime'
import { BaseComponent, NoCache, Resizable } from '@/lib/base'
import { Component, Prop, Watch } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

export type AlignType = 'start' | 'center' | 'end'

@Component
export default class CompImg extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {
    this.clearAlignClass()
    this.m_hAlignChanged(this.hAlign, undefined)
    this.m_vAlignChanged(this.vAlign, undefined)
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ default: '' })
  src!: string

  @Watch('src')
  private m_srcOnChange(newValue: string, oldValue: string): void {
    this.srcChanged(newValue, oldValue)
  }

  @Prop({ default: '' })
  alt!: string

  @Prop({ default: 'center' })
  hAlign!: AlignType

  @Watch('hAlign')
  private m_hAlignOnChange(newValue: AlignType, oldValue: AlignType): void {
    this.m_hAlignChanged(newValue, oldValue as AlignType | undefined)
  }

  @Prop({ default: 'center' })
  vAlign!: AlignType

  @Watch('vAlign')
  private m_vAlignOnChange(newValue: AlignType, oldValue: AlignType): void {
    this.m_vAlignChanged(newValue, oldValue as AlignType | undefined)
  }

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  protected get img(): HTMLImageElement {
    return this.$refs.img as HTMLImageElement
  }

  @NoCache
  private get m_container(): HTMLElement {
    return this.$refs.container as HTMLElement
  }

  @NoCache
  private get m_spinnerContainer(): HTMLElement {
    return this.$refs.spinnerContainer as HTMLElement
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  spinner(spin: boolean): void {
    if (spin) {
      const opacity = parseFloat(this.m_spinnerContainer.style.opacity || '0')
      if (opacity === 1) {
        this.m_spinnerContainer.style.opacity = '0'
      }
      this.m_spinnerContainer.hidden = false
      anime({
        targets: this.m_spinnerContainer,
        opacity: 1,
        duration: 500,
        easing: 'easeInOutQuad',
      })
    } else {
      anime({
        targets: this.m_spinnerContainer,
        opacity: 0,
        duration: 500,
        easing: 'easeInOutQuad',
        complete: () => {
          this.m_spinnerContainer.hidden = true
        },
      })
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  /**
   * srcプロパティが変更された際の処理を行います
   * @param newValue
   * @param oldValue
   */
  protected srcChanged(newValue: string, oldValue?: string) {
    this.img.style.opacity = '0'
    if (this.src) {
      this.spinner(true)
    } else {
      this.spinner(false)
    }

    // 現在の画像のサイズを一旦固定
    // ※画像切り替わり時のガタつき回避のため
    const imgStyle = getComputedStyle(this.img)
    this.img.style.width = imgStyle.width
    this.img.style.height = imgStyle.height

    this.src = newValue || ''
  }

  /**
   * align系のプロパティが変更された際の処理を行います。
   */
  private m_hAlignChanged(newValue: AlignType, oldValue: AlignType | undefined) {
    const toHAlignClass = (position: AlignType) => {
      return `${position}-justified`
    }
    if (oldValue) {
      this.m_container.classList.remove(toHAlignClass(oldValue))
    }
    this.m_container.classList.add(toHAlignClass(newValue))
  }

  private m_vAlignChanged(newValue: AlignType, oldValue: AlignType | undefined) {
    if (oldValue) {
      this.m_container.classList.remove(oldValue)
    }
    this.m_container.classList.add(newValue)
  }

  /**
   * align系のCSSクラスをクリアします。
   */
  private clearAlignClass(): void {
    const toHAlignClass = (position: AlignType) => {
      return `${position}-justified`
    }

    const alignTypes: AlignType[] = ['start', 'center', 'end']
    for (const alignType of alignTypes) {
      this.m_container.classList.remove(alignType)
      this.m_container.classList.remove(toHAlignClass(alignType))
    }
  }

  /**
   * 現在のimgのアスペクト比を取得します。
   */
  private m_getCurrentAspect(): number {
    const num = this.img.width / this.img.height
    return num
  }

  /**
   * 画像本来のアスペクト比を取得します。
   */
  private m_getOriginalAspect(): number {
    const num = this.img.naturalWidth / this.img.naturalHeight
    return num
  }

  private m_getWidth(element: HTMLElement): number {
    const style = getComputedStyle(element)
    return element.clientWidth - this.m_parseInt(style.paddingLeft) - this.m_parseInt(style.paddingRight)
  }

  private m_getHeight(element: HTMLElement): number {
    const style = getComputedStyle(element)
    return element.clientHeight - this.m_parseInt(style.paddingTop) - this.m_parseInt(style.paddingBottom)
  }

  private m_parseInt(value): number {
    if (!value || value === '') {
      return 0
    }

    const parsedValue = parseInt(value, 10)
    if (isNaN(parsedValue)) {
      return 0
    }

    return parsedValue
  }

  private m_fadeInImg() {
    anime({
      targets: this.img,
      opacity: 1,
      duration: 500,
      easing: 'easeInOutQuad',
    })
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  protected imgOnLoad(e) {
    // ロードされた画像サイズへ自動調整
    this.img.style.width = 'auto'
    this.img.style.height = 'auto'

    this.m_fadeInImg()
    this.spinner(false)
  }

  private m_onComponentResize(e) {}
}
</script>
