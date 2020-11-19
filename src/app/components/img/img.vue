<script lang="ts">
import { SetupContext, defineComponent, onMounted, ref, watch } from '@vue/composition-api'
import ImgTemplate from '@/app/components/img/img-template.vue'
import anime from 'animejs'
import { extendedMethod } from '@/app/base'

interface Img extends Img.Props {
  spinner(spin: boolean): void
  /**
   * 画像表示をクリアします。
   */
  clear(): void
  readonly el: HTMLElement
}

type AlignType = 'start' | 'center' | 'end'

type LazyOptions = { root?: HTMLElement; rootMargin?: string }

namespace Img {
  export interface Props {
    src: string
    alt: string
    hAlign: AlignType
    vAlign: AlignType
    lazy: boolean
    lazyOptions: LazyOptions
    noEffect: boolean
  }

  export const props = {
    src: { type: String, default: '' },
    alt: { type: String, default: 'Cannot load image' },
    hAlign: { type: String, default: 'center' },
    vAlign: { type: String, default: 'center' },
    lazy: { type: Boolean, default: false },
    lazyOptions: { type: Object, default: () => {} },
    noEffect: { type: Boolean, default: false },
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

      // IntersectionObserverの設定
      setupIntersectionObserver()

      // srcがバインディングではなく直打ちされた場合、
      // 直打ち分のsrcChanged()が呼び出されない挙動の対応
      props.src && srcChanged(props.src)
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

    // imgタグの画像ソース
    const imgSrc = ref('')

    // 画像が表示領域に表示されているかを示すフラグ
    const isAppeared = ref(false)

    let observer: IntersectionObserver | null = null

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const spinner: Img['spinner'] = spin => {
      if (props.noEffect) return

      if (spin) {
        img.value!.style.opacity = '0'
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

    const clear = extendedMethod<Img['clear']>(() => {
      clearDisplay()
      ctx.emit('update:src', '')
    })

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
    async function srcChanged(newValue: string, oldValue?: string): Promise<void> {
      await load()
    }

    /**
     * `isAppeared`が変更された際の処理を行います。
     */
    const isAppearedChanged = extendedMethod(async (visible: boolean) => {
      await load()
    })

    /**
     * `IntersectionObserver`の設定を行います。
     */
    function setupIntersectionObserver(): void {
      if (observer) {
        observer.disconnect()
        observer = null
        isAppeared.value = false
      }

      if (!props.lazy) return

      observer = new IntersectionObserver((entries, observer) => {
        const newIsAppeared = entries[0].isIntersecting
        if (isAppeared.value !== newIsAppeared) {
          isAppeared.value = newIsAppeared
          isAppearedChanged(newIsAppeared)
        }
      }, props.lazyOptions)

      observer.observe(img.value!)
    }

    /**
     * 画像ロードを行います。
     * @param src
     */
    const load = extendedMethod(async () => {
      // 遅延ロードが有効な場合
      if (props.lazy) {
        // 次の条件が整っている場合のみ画像ロードが行われる
        // - 表示領域に本コンポーネントが表示されている
        // - 現画像のソースとは別のソースが指定されている
        const doLoad = isAppeared.value && imgSrc.value !== props.src
        if (!doLoad) return
      }

      beforeLoad(props.src)
      imgSrc.value = props.src
    })

    /**
     * 画像ロードの前処理を行います。
     * @param src
     */
    function beforeLoad(src: string): void {
      if (!img.value) return

      if (src) {
        spinner(true)
      } else {
        spinner(false)
      }

      // 現在の画像のサイズを一旦固定
      // ※画像切り替わり時のガタつき回避のため
      const imgStyle = getComputedStyle(img.value!)
      img.value!.style.width = imgStyle.width
      img.value!.style.height = imgStyle.height
    }

    /**
     * 画面表示のクリアを行います。
     */
    const clearDisplay = extendedMethod(() => {
      imgSrc.value = ''
      spinner(false)
      img.value!.style.width = 'auto'
      img.value!.style.height = 'auto'
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
      if (props.noEffect) return

      anime({
        targets: img.value!,
        opacity: 1,
        duration: 500,
        easing: 'easeInOutQuad',
      })
      spinner(false)
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

    watch(
      () => props.lazy,
      (newValue: boolean, oldValue?: boolean) => {
        setupIntersectionObserver()
      }
    )

    watch(
      () => props.lazyOptions,
      (newValue: LazyOptions, oldValue?: LazyOptions) => {
        setupIntersectionObserver()
      },
      { deep: true }
    )

    function imgOnLoad() {
      // ロードされた画像サイズへ自動調整
      img.value!.style.width = 'auto'
      img.value!.style.height = 'auto'

      fadeInImg()
    }

    function imgOnError(e: any) {
      clearDisplay()
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
      imgSrc,
      isAppeared,
      spinner,
      clear,
      load,
      beforeLoad,
      clearDisplay,
      imgOnLoad,
      imgOnError,
    }
  }
}

export default Img.clazz
// eslint-disable-next-line no-undef
export { Img, AlignType, LazyOptions }
</script>
