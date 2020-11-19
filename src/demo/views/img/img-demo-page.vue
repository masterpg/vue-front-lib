<style lang="sass" scoped>
@import 'src/app/styles/app.variables'

.ImgDemoPag
  padding: 48px

.control-container
  width: 500px
  margin-bottom: 20px

  .title
    @extend %text-subtitle1
    width: 60px
    font-weight: map_get($text-weights, "medium")

  .input-box
    width: 200px
    > *
      margin-right: 10px

  .input
    width: 100px
    margin-right: 10px

  .str-input
    width: 100px
    margin-right: 10px

.doc-container
  width: 500px
  height: 500px
  border: solid 1px $grey-4
  overflow: auto

  .doc-content
    height: 4000px

    .img-box
      width: 400px
      height: 400px
      margin: 0 auto
      border: solid 1px $grey-4

.img
  height: 100%
  //--img-max-width: 400px
  //--img-max-height: 400px

.h-spacer
  width: 10px
</style>

<template>
  <div class="ImgDemoPag layout vertical center">
    <div class="control-container layout vertical">
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
      <div class="layout horizontal center app-mt-10">
        <label class="title">lazy:</label>
        <q-btn-toggle
          v-model="lazy"
          toggle-color="primary"
          :options="[
            { label: 'true', value: true },
            { label: 'false', value: false },
          ]"
        />
        <div class="h-spacer" />
        <q-input v-model="lazyOptions.rootMargin" label="rootMargin" dense />
      </div>
      <div class="layout horizontal">
        <div class="input-box layout horizontal">
          <q-input v-model.number="imgMaxSize.width" class="input" type="number" input-class="text-right" label="max-width" dense />
          <q-input v-model.number="imgMaxSize.height" class="input" type="number" input-class="text-right" label="max-height" dense />
        </div>
        <q-btn flat rounded color="primary" label="Set" class="app-mt-20" @click="setMaxSizeOnClick" />
      </div>
      <div class="layout horizontal">
        <div class="input-box layout horizontal">
          <q-input v-model.number="imgSize.width" type="number" input-class="text-right" label="width" dense />
          <q-input v-model.number="imgSize.height" type="number" input-class="text-right" label="height" dense />
        </div>
        <q-btn flat rounded color="primary" label="Load" class="app-mt-20" @click="loadOnClick" />
        <q-btn flat rounded color="primary" label="Clear" class="app-mt-20" @click="clearOnClick" />
      </div>
      <div class="layout horizontal">
        <div class="input-box layout horizontal">
          <q-input v-model="inputNodeId" class="flex-1" label="nodeId" dense />
        </div>
        <q-btn flat rounded color="primary" label="Load" class="app-mt-20" @click="loadStorageImgOnClick" />
        <q-btn flat rounded color="primary" label="Clear" class="app-mt-20" @click="clearStorageImgOnClick" />
      </div>
    </div>
    <div ref="docContainer" class="doc-container">
      <div class="doc-content layout vertical around-justified">
        <div class="img-box">
          <Img ref="img" class="img" :src.sync="src" :h-align="hAlign" :v-align="vAlign" :alt="imgAlt" :lazy="lazy" :lazy-options="lazyOptions" />
        </div>
        <StorageImg
          ref="storageImg"
          :node-id.sync="nodeId"
          :h-align="hAlign"
          :v-align="vAlign"
          :alt="imgAlt"
          :lazy="lazy"
          :lazy-options="lazyOptions"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { AlignType, Img } from '@/app/components/img'
import { defineComponent, ref } from '@vue/composition-api'
import { StorageImg } from '@/app/components/storage'

namespace ImgDemoPag {
  export const clazz = defineComponent({
    name: 'ImgDemoPag',

    components: {
      Img: Img.clazz,
      StorageImg: StorageImg.clazz,
    },

    setup(props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const img = ref<Img>()
      const storageImg = ref<StorageImg>()
      const docContainer = ref<HTMLElement>()

      const src = ref('')

      const inputNodeId = ref('InzqeQFQqQyR1xC2He6m')
      const nodeId = ref('')

      const imgAlt = ref('Dummy Image')

      const hAlign = ref<AlignType>('center')

      const vAlign = ref<AlignType>('center')

      const lazy = ref(false)

      const imgSize = ref({ width: 300, height: 200 })

      const imgMaxSize = ref({ width: 0, height: 0 })

      const lazyOptions = ref({ root: docContainer, rootMargin: '100px' })

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      function loadOnClick() {
        src.value = `https://dummyimage.com/${imgSize.value.width}x${imgSize.value.height}/000/fff`
      }

      function clearOnClick() {
        img.value!.clear()
      }

      function loadStorageImgOnClick() {
        nodeId.value = inputNodeId.value
      }

      function clearStorageImgOnClick() {
        storageImg.value!.clear()
      }

      function setMaxSizeOnClick() {
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
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        img,
        storageImg,
        inputNodeId,
        nodeId,
        docContainer,
        src,
        imgAlt,
        hAlign,
        vAlign,
        lazy,
        imgSize,
        imgMaxSize,
        lazyOptions,
        loadOnClick,
        clearOnClick,
        loadStorageImgOnClick,
        clearStorageImgOnClick,
        setMaxSizeOnClick,
      }
    },
  })
}

export default ImgDemoPag.clazz
</script>
