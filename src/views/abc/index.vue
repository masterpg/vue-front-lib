<style lang="scss">
</style>

<template>
  <v-card class="pa-3" :class="{'ma-5': !sp, 'ma-3': sp}">
    <v-text-field
      label="Input Message"
      v-model="msg"
      class="body-1"
    ></v-text-field>
    <p>propA: {{propA}}</p>
    <p>propB: {{propB}}</p>
    <p>msg: {{msg}}</p>
    <p>helloMsg: {{helloMsg}}</p>
    <p>computed msg: {{computedMsg}}</p>
    <hello ref="hello"/>
    <v-btn small @click="greetButtonOnClick">Greet</v-btn>
    <v-btn small @click="sleepButtonOnClick">Sleep</v-btn>
  </v-card>
</template>

<script lang="ts">
  import Vue from 'vue';
  import { Component, Inject, Model, Prop, Watch } from 'vue-property-decorator';
  import Hello from './hello.vue';

  @Component({
    components: {
      hello: Hello,
    },
  })
  export default class AbcView extends Vue {

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

    private get sp() {
      return this.$vuetify.breakpoint.name === 'xs';
    }

    // lifecycle hook
    mounted() {
      this.msg = 'mounted';
      this.hello = this.$refs.hello as Hello;
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