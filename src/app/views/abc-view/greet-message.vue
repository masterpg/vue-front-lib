<template>
  <div>greet times: {{ greetTimes }}</div>
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
  private greetTimes: number = 0;
  greet(): void {
    alert('greeting: ' + this.message);
    this.greetTimes++;
  }
}
</script>
