<style lang="postcss" scoped>
@import '../../styles/typography.pcss';

.title {
  @extend %app-font-subhead;
  font-weight: 500;
}

.value {
  @extend %app-font-subhead;
}

span {
  color: var(--greet-message-color);
}
</style>


<template>
  <div><span class="title">greet times: </span><span class="value">{{ m_greetTimes }}</span></div>
</template>


<script lang="ts">
import { BaseComponent } from '../../base/component';
import { Component, Prop } from 'vue-property-decorator';

@Component
export default class GreetMessage extends BaseComponent {
  @Prop()
  message: string;

  m_greetTimes: number = 0;

  greet(): void {
    alert('greeting: ' + this.message);
    this.m_greetTimes++;
  }
}
</script>
