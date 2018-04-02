<style lang="scss">
</style>

<template>
  <div>
    <input v-model="msg">
    <p>propA: {{propA}}</p>
    <p>propB: {{propB}}</p>
    <p>msg: {{msg}}</p>
    <p>helloMsg: {{helloMsg}}</p>
    <p>computed msg: {{computedMsg}}</p>
    <button @click="greetButtonOnClick">Greet</button>
    <button @click="sleepButtonOnClick">Sleep</button>
    <hello ref="hello"/>
  </div>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
  import Hello from './hello.vue';

  @Component({
    components: {
      'hello': Hello,
    },
  })
  export default class AbcApp extends Vue {

    @Prop({ default: 'default value A' })
    propA: string;

    @Prop({ default: 'default value B' })
    propB: string;

    // inital data
    private msg: string = '';

    // use prop values for initial data
    private helloMsg: string = 'Hello, ' + this.propA;

    private hello: Hello;

    // computed
    private get computedMsg() {
      return 'computed ' + this.msg;
    }

    // lifecycle hook
    mounted() {
      this.msg = 'mounted';
      this.hello = <Hello>this.$refs.hello;
    }

    private greet() {
      alert('greeting: ' + this.msg);
      this.hello.sayHello();
    }

    private async sleep(ms: number = 1000): Promise<void> {
      return new Promise<void>((resolve) => {
        setTimeout(() => {
          resolve();
        }, ms);
      });
    }

    private greetButtonOnClick() {
      this.greet();
    }

    private async sleepButtonOnClick() {
      await this.sleep();
      alert('よく寝た！');
    }
  }
</script>