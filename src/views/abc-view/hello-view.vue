<style lang="stylus" scoped>
  p {
    color: var(--hello-view-color);
  }
</style>

<template>
  <p>hello times: {{ helloTimes }}</p>
</template>

<script lang="ts">
  import { Component } from 'vue-property-decorator';
  import { VueComponent } from '../../components';

  @Component
  export default class HelloView extends VueComponent {
    private helloTimes: number = 0;

    sayHello() {
      this.helloTimes++;
    }
  }
</script>
