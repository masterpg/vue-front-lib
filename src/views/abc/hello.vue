<template>
  <p>hello times: {{ helloTimes }}</p>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Component } from 'vue-property-decorator';

  @Component
  export default class Hello extends Vue {
    private helloTimes: number = 0;

    sayHello() {
      this.helloTimes++;
    }
  }
</script>
