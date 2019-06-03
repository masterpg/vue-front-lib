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
  <div>
    <span class="title">greet times: </span><span class="value">{{ m_greetTimes }}</span>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator'
import { BaseComponent } from '@/base/component'

@Component({ name: 'greet-message' })
export default class GreetMessage extends BaseComponent {
  @Prop({ default: '' })
  message!: string

  private m_greetTimes: number = 0

  greet(): void {
    alert('greeting: ' + this.message)
    this.m_greetTimes++
  }
}
</script>
