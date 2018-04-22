<style lang="stylus" scoped>
  @import '~vuetify/src/stylus/settings/_colors'
  .hello-view {
    --hello-view-color: $indigo.base;
  }
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
    <hello-view ref="helloView" class="hello-view"></hello-view>
    <v-btn small @click="greetButtonOnClick">Greet</v-btn>
    <v-btn small @click="sleepButtonOnClick">Sleep</v-btn>
  </v-card>
</template>

<script lang="ts">
  import HelloView from './hello-view.vue';
  import { Component, Prop } from 'vue-property-decorator';
  import { VueComponent } from '../../components';

  @Component({
    components: {
      'hello-view': HelloView,
    },
  })
  export default class AbcView extends VueComponent {

    @Prop({ default: 'default value A' })
    propA: string;

    @Prop({ default: 'default value B' })
    propB: string;

    // inital data
    private msg: string = '';

    // use prop values for initial data
    private helloMsg: string = 'Hello, ' + this.propA;

    private helloView: HelloView;

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
      this.helloView = this.$refs.helloView as HelloView;
    }

    private greet() {
      alert('greeting: ' + this.msg);
      this.helloView.sayHello();
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