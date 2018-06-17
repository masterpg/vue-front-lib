<template>
  <div>greet times: {{ m_greetTimes }}</div>
</template>


<style lang="stylus" scoped>
  div {
    color: var(--greet-message-color);
  }
</style>


<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { ElementComponent } from '../../components';

@Component
export default class GreetMessage extends ElementComponent {
  @Prop() message: string;

  m_greetTimes: number = 0;

  greet(): void {
    alert('greeting: ' + this.message);
    this.m_greetTimes++;
  }
}
</script>
