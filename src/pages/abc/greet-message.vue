<style scoped>
@import '../../styles/placeholder/typography.css';

.title {
  @extend %comm-font-subhead1;
  font-weight: 500;
}

.value {
  @extend %comm-font-subhead1;
}

span {
  color: var(--greet-message-color, var(--comm-red-500));
}
</style>

<template>
  <div @component-resize="m_onComponentResize">
    <span class="title">greet times: </span><span class="value">{{ m_greetTimes }}</span>
  </div>
</template>

<script lang="ts">
import { BaseComponent, ResizableMixin } from '@/base/component'
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
