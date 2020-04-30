<style lang="sass" scoped>
@import '../../../styles/app.variables'

.img-demo-pag-main
  padding: 48px

.img-container
  width: 500px
  height: 500px
  border: solid 1px $grey-4

.img
  height: 100%
  /*--comp-img-max-width: 400px*/
  /*--comp-img-max-height: 400px*/

.title
  @extend %text-subtitle1
  width: 60px
  font-weight: map_get($text-weights, "medium")

.img-size-input
  width: 100px
</style>

<template>
  <div class="img-demo-pag-main layout vertical center">
    <div class="layout vertical center-center app-mb-20">
      <div class="layout horizontal center">
        <label class="title">hAlign:</label>
        <q-btn-toggle
          v-model="m_hAlign"
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
          v-model="m_vAlign"
          toggle-color="primary"
          :options="[
            { label: 'start', value: 'start' },
            { label: 'center', value: 'center' },
            { label: 'end', value: 'end' },
          ]"
        />
      </div>
      <div class="layout horizontal">
        <q-input v-model.number="m_imgSize.width" type="number" input-class="text-right" label="width" dense class="img-size-input" />
        <q-input v-model.number="m_imgSize.height" type="number" input-class="text-right" label="height" dense class="img-size-input app-ml-10" />
        <q-btn flat rounded color="primary" label="Load" class="app-mt-20" @click="m_loadOnClick" />
      </div>
      <div class="layout horizontal">
        <q-input v-model.number="m_imgMaxSize.width" type="number" input-class="text-right" label="max-width" dense class="img-size-input" />
        <q-input
          v-model.number="m_imgMaxSize.height"
          type="number"
          input-class="text-right"
          label="max-height"
          dense
          class="img-size-input app-ml-10"
        />
        <q-btn flat rounded color="primary" label="Set" class="app-mt-20" @click="m_setMaxSizeOnClick" />
      </div>
    </div>
    <div class="img-container">
      <comp-img ref="img" :h-align="m_hAlign" :v-align="m_vAlign" :src="m_imgSrc" :alt="m_imgAlt" class="img" />
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, CompImg, NoCache, Resizable } from '@/lib'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component({
  components: { CompImg },
})
export default class ImgDemoPage extends mixins(BaseComponent, Resizable) {
  //----------------------------------------------------------------------
  //
  //  Lifecycle hooks
  //
  //----------------------------------------------------------------------

  mounted() {}

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_imgSrc = ''

  private m_imgAlt = 'Dummy Image'

  private m_hAlign = 'center'

  private m_vAlign = 'center'

  private m_imgSize: { width: number; height: number } = {
    width: 300,
    height: 200,
  }

  private m_imgMaxSize: { width: number; height: number } = {
    width: 0,
    height: 0,
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  get m_img(): CompImg {
    return this.$refs.img as CompImg
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private m_loadImg(): void {
    this.m_imgSrc = ''
    setTimeout(() => {
      this.m_imgSrc = `https://dummyimage.com/${this.m_imgSize.width}x${this.m_imgSize.height}/000/fff`
    })
  }

  private m_setMaxSize(): void {
    let maxWidth = '100%'
    if (this.m_imgMaxSize.width > 0) {
      maxWidth = `${this.m_imgMaxSize.width}px`
    }
    ;(this.m_img.$el as HTMLElement).style.setProperty('--comp-img-max-width', maxWidth)

    let maxHeight = '100%'
    if (this.m_imgMaxSize.height > 0) {
      maxHeight = `${this.m_imgMaxSize.height}px`
    }
    ;(this.m_img.$el as HTMLElement).style.setProperty('--comp-img-max-height', maxHeight)
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_loadOnClick() {
    this.m_loadImg()
  }

  private m_setMaxSizeOnClick() {
    this.m_setMaxSize()
  }
}
</script>
