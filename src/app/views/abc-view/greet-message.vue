<style lang="stylus" scoped>
  @import '../../../assets/styles/_typography.styl';

  .title {
    @extend .app-font-subhead;
    font-weight: 500;
  }

  .value {
    @extend .app-font-subhead;
  }

  span {
    color: var(--greet-message-color);
  }
</style>


<template>
  <div><span class="title">greet times: </span><span class="value">{{ m_greetTimes }}</span></div>
</template>


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
