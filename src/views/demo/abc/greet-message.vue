<style lang="sass" scoped>
@import '../../../styles/app.variables'

.title
  @extend %text-subtitle1
  font-weight: map_get($text-weights, "medium")

.value
  @extend %text-subtitle1

span
  color: var(--greet-message-color, $red-5)
</style>

<template>
  <div @component-resize="m_onComponentResize">
    <span class="title">greet times: </span><span class="value">{{ m_greetTimes }}</span>
  </div>
</template>

<script lang="ts">
import { BaseComponent, ResizableMixin } from '@/components/base'
import { Component, Prop } from 'vue-property-decorator'
import { mixins } from 'vue-class-component'

@Component({ name: 'greet-message' })
export default class GreetMessage extends mixins(BaseComponent, ResizableMixin) {
  @Prop({ default: '' })
  message!: string

  private m_greetTimes: number = 0

  greet(): void {
    alert('greeting: ' + this.message)
    this.m_greetTimes++
  }

  private m_onComponentResize(e) {
    console.log('greet-message:', e)
  }
}
</script>
