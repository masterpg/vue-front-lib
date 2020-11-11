<script lang="ts">
import { SetupContext, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import ImgTemplate from '@/app/components/img/img-template.vue'
import anime from 'animejs'
import { extendedMethod } from '@/app/base'

interface Img extends Img.Props {
  spinner(spin: boolean): void
  el: HTMLElement
}

type AlignType = 'start' | 'center' | 'end'

namespace Img {
  export interface Props {
    src: string
    alt: string
    hAlign: AlignType
    vAlign: AlignType
  }

  export const props = {
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    hAlign: { type: String, default: 'center' },
    vAlign: { type: String, default: 'center' },
  }

  export const clazz = defineComponent({
    name: 'Img',

    mixins: [ImgTemplate],

    props,

    setup: (props: Readonly<Props>, ctx) => setup(props, ctx),
  })

  export function setup(props: Readonly<Props>, ctx: SetupContext) {
    //----------------------------------------------------------------------
    //
    //  Lifecycle hooks
    //
    //----------------------------------------------------------------------

    onMounted(() => {
      clearAlignClass()
      hAlignChanged(props.hAlign)
      vAlignChanged(props.vAlign)
    })

    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const container = ref<HTMLElement>()
    const el = container
    const img = ref<HTMLImageElement>()
    const spinnerContainer = ref<HTMLElement>()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const spinner: Img['spinner'] = spin => {
      if (spin) {
        const opacity = parseFloat(spinnerContainer.value!.style.opacity || '0')
        if (opacity === 1) {
          spinnerContainer.value!.style.opacity = '0'
        }
        spinnerContainer.value!.hidden = false
        anime({
          targets: spinnerContainer.value!,
          opacity: 1,
          duration: 500,
          easing: 'easeInOutQuad',
        })
      } else {
        anime({
          targets: spinnerContainer.value!,
          opacity: 0,
          duration: 500,
          easing: 'easeInOutQuad',
          complete: () => {
            spinnerContainer.value!.hidden = true
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
    const srcChanged = extendedMethod<(newValue: string, oldValue?: string) => Promise<void>>(async (newValue, oldValue) => {
      img.value!.style.opacity = '0'
      if (props.src) {
        spinner(true)
      } else {
        spinner(false)
      }

      // 現在の画像のサイズを一旦固定
      // ※画像切り替わり時のガタつき回避のため
      const imgStyle = getComputedStyle(img.value!)
      img.value!.style.width = imgStyle.width
      img.value!.style.height = imgStyle.height
    })

    /**
     * hAlignプロパティが変更された際の処理を行います。
     */
    function hAlignChanged(newValue: AlignType, oldValue?: AlignType) {
      const toHAlignClass = (position: AlignType) => {
        return `${position}-justified`
      }
      if (oldValue) {
        container.value!.classList.remove(toHAlignClass(oldValue))
      }
      container.value!.classList.add(toHAlignClass(newValue))
    }

    /**
     * vAlignプロパティが変更された際の処理を行います。
     */
    function vAlignChanged(newValue: AlignType, oldValue?: AlignType) {
      if (oldValue) {
        container.value!.classList.remove(oldValue)
      }
      container.value!.classList.add(newValue)
    }

    /**
     * align系のCSSクラスをクリアします。
     */
    function clearAlignClass(): void {
      const toHAlignClass = (position: AlignType) => {
        return `${position}-justified`
      }

      const alignTypes: AlignType[] = ['start', 'center', 'end']
      for (const alignType of alignTypes) {
        container.value!.classList.remove(alignType)
        container.value!.classList.remove(toHAlignClass(alignType))
      }
    }

    /**
     * 現在のimgのアスペクト比を取得します。
     */
    function getCurrentAspect(): number {
      return img.value!.width / img.value!.height
    }

    /**
     * 画像本来のアスペクト比を取得します。
     */
    function getOriginalAspect(): number {
      return img.value!.naturalWidth / img.value!.naturalHeight
    }

    function getWidth(element: HTMLElement): number {
      const style = getComputedStyle(element)
      return element.clientWidth - myParseInt(style.paddingLeft) - myParseInt(style.paddingRight)
    }

    function getHeight(element: HTMLElement): number {
      const style = getComputedStyle(element)
      return element.clientHeight - myParseInt(style.paddingTop) - myParseInt(style.paddingBottom)
    }

    function myParseInt(value: string): number {
      if (!value || value === '') {
        return 0
      }

      const parsedValue = parseInt(value, 10)
      if (isNaN(parsedValue)) {
        return 0
      }

      return parsedValue
    }

    function fadeInImg() {
      anime({
        targets: img.value!,
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

    watch(
      () => props.src,
      (newValue: string, oldValue?: string) => {
        srcChanged(newValue, oldValue)
      }
    )

    watch(
      () => props.hAlign,
      (newValue: AlignType, oldValue?: AlignType) => {
        hAlignChanged(newValue, oldValue)
      }
    )

    watch(
      () => props.vAlign,
      (newValue: AlignType, oldValue?: AlignType) => {
        vAlignChanged(newValue, oldValue)
      }
    )

    function imgOnLoad() {
      // ロードされた画像サイズへ自動調整
      img.value!.style.width = 'auto'
      img.value!.style.height = 'auto'

      fadeInImg()
      spinner(false)
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      el,
      container,
      img,
      spinnerContainer,
      spinner,
      srcChanged,
      imgOnLoad,
    }
  }
}

export default Img.clazz
// eslint-disable-next-line no-undef
export { Img, AlignType }
</script>
