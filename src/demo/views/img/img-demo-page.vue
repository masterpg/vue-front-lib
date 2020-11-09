<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ImgDemoPag
  padding: 48px

.img-container
  width: 500px
  height: 500px
  border: solid 1px $grey-4

.img
  height: 100%
  //--img-max-width: 400px
  //--img-max-height: 400px

.title
  @extend %text-subtitle1
  width: 60px
  font-weight: map_get($text-weights, "medium")

.img-size-input
  width: 100px
</style>

<template>
  <div class="ImgDemoPag layout vertical center">
    <div class="layout vertical center-center app-mb-20">
      <div class="layout horizontal center">
        <label class="title">hAlign:</label>
        <q-btn-toggle
          v-model="hAlign"
          toggle-color="primary"
          :options="[
            { label: 'start', value: 'start' },
            { label: 'center', value: 'center' },
            { label: 'end', value: 'end' },
          ]"
        />
      </div>
      <div class="layout horizontal center app-mt-10">
        <label class="title">vAlign:</label>
        <q-btn-toggle
          v-model="vAlign"
          toggle-color="primary"
          :options="[
            { label: 'start', value: 'start' },
            { label: 'center', value: 'center' },
            { label: 'end', value: 'end' },
          ]"
        />
      </div>
      <div class="layout horizontal">
        <q-input v-model.number="imgSize.width" type="number" input-class="text-right" label="width" dense class="img-size-input" />
        <q-input v-model.number="imgSize.height" type="number" input-class="text-right" label="height" dense class="img-size-input app-ml-10" />
        <q-btn flat rounded color="primary" label="Load" class="app-mt-20" @click="loadOnClick" />
      </div>
      <div class="layout horizontal">
        <q-input v-model.number="imgMaxSize.width" type="number" input-class="text-right" label="max-width" dense class="img-size-input" />
        <q-input
          v-model.number="imgMaxSize.height"
          type="number"
          input-class="text-right"
          label="max-height"
          dense
          class="img-size-input app-ml-10"
        />
        <q-btn flat rounded color="primary" label="Set" class="app-mt-20" @click="setMaxSizeOnClick" />
      </div>
    </div>
    <div class="img-container">
      <Img ref="img" :h-align="hAlign" :v-align="vAlign" :src="imgSrc" :alt="imgAlt" class="img" />
    </div>
  </div>
</template>

<script lang="ts">
import { AlignType, Img } from '@/app/components/img'
import { computed, defineComponent, ref } from '@vue/composition-api'

namespace ImgDemoPag {
  export const clazz = defineComponent({
    name: 'ImgDemoPag',

    components: {
      Img: Img.clazz,
    },

    setup(props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const img = ref<Img>()

      const imgSrc = ref('')

      const imgAlt = ref('Dummy Image')

      const hAlign = ref<AlignType>('center')

      const vAlign = ref<AlignType>('center')

      const _imgSize = ref({ width: 300, height: 200 })
      const imgSize = computed(() => _imgSize.value)

      const _imgMaxSize = ref({ width: 0, height: 0 })
      const imgMaxSize = computed(() => _imgMaxSize.value)

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function loadImg(): void {
        imgSrc.value = ''
        setTimeout(() => {
          imgSrc.value = `https://dummyimage.com/${imgSize.value.width}x${imgSize.value.height}/000/fff`
        })
      }

      function setMaxSize(): void {
        let maxWidth = '100%'
        if (imgMaxSize.value.width > 0) {
          maxWidth = `${imgMaxSize.value.width}px`
        }
        img.value!.el.style.setProperty('--img-max-width', maxWidth)

        let maxHeight = '100%'
        if (imgMaxSize.value.height > 0) {
          maxHeight = `${imgMaxSize.value.height}px`
        }
        img.value!.el.style.setProperty('--img-max-height', maxHeight)
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      function loadOnClick() {
        loadImg()
      }

      function setMaxSizeOnClick() {
        setMaxSize()
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        img,
        imgSrc,
        imgAlt,
        hAlign,
        vAlign,
        imgSize,
        imgMaxSize,
        loadOnClick,
        setMaxSizeOnClick,
      }
    },
  })
}

export default ImgDemoPag.clazz
</script>
