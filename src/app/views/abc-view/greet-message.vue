<style lang="stylus" scoped>
  div {
    color: var(--greet-message-color);
  }
</style>

<template>
  <div>greet times: {{ greetTimes }}</div>
</template>

<script lang="ts">
  import { Component, Prop } from 'vue-property-decorator';
  import { VueComponent } from '../../components';

  @Component
  export default class GreetMessage extends VueComponent {
    @Prop()
    message: string;

    private greetTimes: number = 0;

    greet(): void {
      alert('greeting: ' + this.message);
      this.greetTimes++;
    }
  }
</script>
