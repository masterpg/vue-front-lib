<style lang="stylus" scoped>
@import '../../../assets/styles/_typography.styl';

.greet-message {
  --greet-message-color: var(--paper-indigo-a200);
}

.title {
  @extend .app-font-subhead;
  font-weight: 500;
}

.value {
  @extend .app-font-subhead;
}
</style>


<template>
  <div class="layout vertical">
    <paper-card class="app-pa-3" :class="{ 'app-ma-12': f_pc, 'app-ma-6': f_tab, 'app-ma-3': f_sp }">
      <paper-input
        label="Input Message"
        :value="m_message" @input="m_message = $event.target.value"
      ></paper-input>
      <p><span class="title">propA: </span><span class="value">{{ propA }}</span></p>
      <p><span class="title">propB: </span><span class="value">{{ propB }}</span></p>
      <p><span class="title">message: </span><span class="value">{{ m_message }}</span></p>
      <p><span class="title">custom propA: </span><span class="value">{{ m_customPropA }}</span></p>
      <p><span class="title">reversed message: </span><span class="value">{{ m_reversedMessage }}</span></p>
      <p><span class="title">double reversed message: </span><span class="value">{{ m_doubleReversedMessage }}</span></p>
      <div class="layout horizontal center">
        <greet-message
          ref="greetMessage"
          :message="m_message"
          class="greet-message"
        ></greet-message>
        <button class="app-ml-3" @click="m_greetButtonOnClick">Greet</button>
      </div>
      <p>
        <span class="title">post times: </span><span class="value">{{ m_post.times }}</span>
        <button class="app-ml-3" @click="m_postButtonOnClick">Post</button>
      </p>
      <p class="layout horizontal">
        <custom-input
          v-model="m_customInputValue"
          class="flex-3"
        ></custom-input>
        <span class="flex-9 app-ml-3 app-mt-7">
          <span class="title">value: </span><span class="value">{{ m_customInputValue }}</span>
        </span>
      </p>
      <p class="layout horizontal center">
        <custom-checkbox
          v-model="m_customChecked"
        ></custom-checkbox>
        <span class="app-ml-3">
          <span class="title">checked: </span><span class="value">{{ m_customChecked }}</span>
        </span>
      </p>
      <div class="layout horizontal end-justified">
        <paper-button raised @click="m_sleepButtonOnClick">Sleep</paper-button>
      </div>
    </paper-card>
  </div>
</template>


<script lang="ts">
import '@polymer/paper-button/paper-button';
import '@polymer/paper-card/paper-card';
import '@polymer/paper-input/paper-input';
import CustomCheckbox from './custom-checkbox.vue';
import CustomInput from './custom-input.vue';
import GreetMessage from './greet-message.vue';
import { Component, Prop, Watch } from 'vue-property-decorator';
import { ElementComponent } from '../../components';
import { mixins } from 'vue-class-component';

interface Post {
  message: string;
  times: number;
}

@Component({
  components: {
    'greet-message': GreetMessage,
    'custom-checkbox': CustomCheckbox,
    'custom-input': CustomInput,
  },
})
export default class AbcView extends mixins(ElementComponent) {
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

  m_message: string = '';

  m_customInputValue: string = '';

  m_customChecked: boolean = false;

  // propの値を初期化に利用できる
  m_customPropA: string = 'custom ' + this.propA;

  m_post: Post = {
    message: '',
    times: 0,
  };

  //--------------------------------------------------
  //  computed
  //--------------------------------------------------

  get m_reversedMessage() {
    return this.m_message
      .split('')
      .reverse()
      .join('');
  }

  get m_doubleReversedMessage() {
    return this.m_reversedMessage
      .split('')
      .reverse()
      .join('');
  }

  //--------------------------------------------------
  //  watch
  //--------------------------------------------------

  @Watch('m_message')
  m_messageOnChange(newValue: string, oldValue: string): void {
    // tslint:disable-next-line
    console.log(`m_messageOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`);
  }

  @Watch('m_reversedMessage')
  m_reversedMessageOnChange(newValue: string, oldValue: string): void {
    // tslint:disable-next-line
    console.log(`m_reversedMessageOnChange: newValue: "${newValue}", oldValue: "${oldValue}"`);
  }

  @Watch('m_post', { deep: true })
  m_postOnChange(newValue: Post, oldValue: Post): void {
    // tslint:disable-next-line
    console.log('m_postOnChange: newValue:', newValue, ', oldValue:', oldValue);
  }

  @Watch('m_post.times')
  m_postTimesOnChange(newValue: string, oldValue: string): void {
    // tslint:disable-next-line
    console.log('m_postTimesOnChange: newValue:', newValue, ', oldValue:', oldValue);
  }

  //--------------------------------------------------
  //  lifecycle hooks
  //--------------------------------------------------

  mounted() {
    this.m_message = 'mounted';
  }

  //--------------------------------------------------
  //  internal methods
  //--------------------------------------------------

  async m_sleep(ms: number): Promise<string> {
    return new Promise<string>((resolve) => {
      setTimeout(() => {
        resolve(`I slept for ${ms} ms.`);
      }, ms);
    });
  }

  //--------------------------------------------------
  //  event handlers
  //--------------------------------------------------

  m_greetButtonOnClick() {
    this.m_greetMessage.greet();
  }

  m_postButtonOnClick() {
    this.m_post.message = this.m_message;
    this.m_post.times++;
  }

  async m_sleepButtonOnClick() {
    alert(await this.m_sleep(2000));
  }

  //--------------------------------------------------
  //  elements
  //--------------------------------------------------

  get m_greetMessage(): GreetMessage {
    return this.$refs.greetMessage as GreetMessage;
  }
}
</script>
