<style lang="stylus" scoped>
  @import '~vuetify/src/stylus/settings/_colors'
  .greet-message {
    --greet-message-color: $indigo.base;
  }
</style>

<template>
  <v-card class="pa-3" :class="{ 'ma-5': pc, 'ma-3': tab, 'ma-0': sp }">
    <v-text-field
      label="Input Message"
      v-model="message"
    ></v-text-field>
    <p>propA: {{ propA }}</p>
    <p>propB: {{ propB }}</p>
    <p>message: {{ message }}</p>
    <p>custom propA: {{ customPropA }}</p>
    <p>computed message: {{ computedMessage }}</p>
    <div class="layout horizontal center">
      <greet-message
        ref="greetMessage"
        :message="message"
        class="greet-message mr-3"
      ></greet-message>
      <v-btn small @click="greetButtonOnClick">Greet</v-btn>
    </div>
    <div class="layout horizontal center">
      <custom-input
        v-model="customInputValue"
        class="flex-3 mr-3"
      ></custom-input>
      <div class="flex-9">value: {{ customInputValue }}</div>
    </div>
    <div class="layout horizontal center">
      <custom-checkbox
        v-model="customChecked"
        class="flex-3 mr-3"
      ></custom-checkbox>
      <div class="flex-9">checked: {{ customChecked }}</div>
    </div>
    <div class="layout horizontal end-justified">
      <v-btn small @click="postButtonOnClick">Post</v-btn>
      <v-btn small @click="sleepButtonOnClick">Sleep</v-btn>
    </div>
  </v-card>
</template>

<script lang="ts">
  import GreetMessage from './greet-message.vue';
  import CustomCheckbox from './custom-checkbox.vue';
  import CustomInput from './custom-input.vue';
  import { Component, Prop, Watch } from 'vue-property-decorator';
  import { VueComponent } from '../../components';

  interface Post {
    title: string;
    message: string;
  }

  @Component({
    components: {
      'greet-message': GreetMessage,
      'custom-checkbox': CustomCheckbox,
      'custom-input': CustomInput,
    },
  })
  export default class AbcView extends VueComponent {

    //--------------------------------------------------
    //  props
    //--------------------------------------------------

    // propの初期化は@Propのdefaultで行う

    @Prop({ default: 'prop value A' })
    propA: string;

    @Prop({ default: 'prop value B' })
    propB: string;

    //--------------------------------------------------
    //  data
    //--------------------------------------------------

    // dataは初期化が必要！

    private message: string = '';

    private customInputValue: string = '';

    private customChecked: boolean = false;

    // propの値を初期化に利用できる
    private customPropA: string = 'custom ' + this.propA;

    private post: Post = {
      title: 'Dear Jhon',
      message: '',
    };

    //--------------------------------------------------
    //  computed
    //--------------------------------------------------

    private get computedMessage() {
      return 'computed ' + this.message;
    }

    //--------------------------------------------------
    //  watch
    //--------------------------------------------------

    @Watch('message')
    private messageOnChange(newValue: string, oldValue: string): void {
      // tslint:disable-next-line
      console.log(`messageOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`);
    }

    @Watch('computedMessage')
    private computedMessageOnChange(newValue: string, oldValue: string): void {
      // tslint:disable-next-line
      console.log(`computedMessageOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`);
    }

    @Watch('post', { deep: true })
    private postOnChange(newValue: Post, oldValue: Post): void {
      // tslint:disable-next-line
      console.log('postOnChange: newValue:', newValue, ', oldValue:', oldValue);
    }

    //--------------------------------------------------
    //  lifecycle callbacks
    //--------------------------------------------------

    mounted() {
      this.message = 'mounted';
    }

    //--------------------------------------------------
    //  internal methods
    //--------------------------------------------------

    private async sleep(ms: number): Promise<string> {
      return new Promise<string>((resolve) => {
        setTimeout(() => {
          resolve(`I slept for ${ms} ms.`);
        }, ms);
      });
    }

    //--------------------------------------------------
    //  event handlers
    //--------------------------------------------------

    private greetButtonOnClick() {
      this.greetMessage.greet();
    }

    private postButtonOnClick() {
      this.post.message = this.message;
    }

    private async sleepButtonOnClick() {
      alert(await this.sleep(2000));
    }

    //--------------------------------------------------
    //  elements
    //--------------------------------------------------

    private get greetMessage(): GreetMessage {
      return this.$refs.greetMessage as GreetMessage;
    }

  }
</script>