<style scoped>
.hello-world-color {
  color: var(--comm-indigo-a200);
}
</style>

<template>
  <q-card class="layout vertical comm-pa-20" :class="{ 'comm-ma-48': pcScreen, 'comm-ma-24': tabScreen, 'comm-ma-12': spScreen }">
    <div class="hello-world-color">{{ $t('hello', { today: $d(new Date(), 'short') }) }}</div>
    <div class="layout horizontal end-justified comm-mt-10">
      <q-btn color="primary" label="Sleep" @click="m_sleepButtonOnClick" />
    </div>
  </q-card>
</template>

<script lang="ts">
import { BaseComponent } from '@/base/component'
import { Component } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component
export default class PlaygroundView extends mixins(BaseComponent) {
  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_sleep(ms: number): Promise<string> {
    return new Promise(resolve => {
      setTimeout(() => {
        resolve(`I slept for ${ms} ms.`)
      }, ms)
    }) as Promise<string>
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  private async m_sleepButtonOnClick() {
    alert(await this.m_sleep(2000))
  }
}
</script>

<i18n>
en:
  hello: "Hello World! Today is {today}."
ja:
  hello: "こんにちは、世界！ 今日は {today} です。"
</i18n>
