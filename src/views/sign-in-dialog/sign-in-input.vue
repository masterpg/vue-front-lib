<style scoped>
.textfield-wrapper {
  width: 100%;
}

.textfield-label {
  &::after {
    background-color: #3f51b5;
  }
}

.textfield-input {
  border-radius: 0; /* iOS puts rounded corners on text inputs. */
  color: rgba(0, 0, 0, 0.87);
  direction: ltr;
  font-size: 16px;
  text-align: left;
  width: 100%;
}

.textfield-error {
  color: #dd2c00;
  direction: ltr;
  font-size: 12px;
  line-height: 16px;
  margin: -16px 0 0 0;
  min-height: 16px;
  text-align: left;
}
</style>

<template>
  <div>
    <div ref="textInputWrapper" class="mdl-textfield mdl-js-textfield mdl-textfield--floating-label textfield-wrapper">
      <label class="mdl-textfield__label textfield-label">{{ itemName }}</label>
      <input
        ref="textInput"
        :type="type"
        :name="name"
        :required="required"
        :readonly="readonly"
        @input="m_textInputOnChange($event);"
        class="mdl-textfield__input textfield-input"
      />
    </div>
    <p class="textfield-error">{{ m_errorMessage }}</p>
  </div>
</template>

<script lang="ts">
import { Component, Prop } from 'vue-property-decorator';
import { BaseComponent } from '@/base/component';
import { mixins } from 'vue-class-component';

@Component
export default class SignInInput extends mixins(BaseComponent) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  get m_textInputWrapper(): HTMLDivElement {
    return this.$refs.textInputWrapper as any;
  }

  get m_textInput(): HTMLInputElement {
    return this.$refs.textInput as any;
  }

  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ default: '' })
  value: string;

  @Prop({ default: '' })
  type: 'text' | 'email' | 'password';

  @Prop({ default: '' })
  name: string;

  @Prop({ default: '' })
  itemName: string;

  @Prop({ type: Boolean, default: false })
  required: boolean;

  @Prop({ type: Boolean, default: false })
  readonly: boolean;

  m_errorMessage: string = '';

  get errorMessage(): string {
    return this.m_errorMessage;
  }

  set errorMessage(value: string) {
    this.m_errorMessage = value;
    if (value) {
      this.m_textInputWrapper.classList.add('is-invalid');
    } else {
      this.m_textInputWrapper.classList.remove('is-invalid');
    }
  }

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  init(): void {
    if (this.m_textInput.value || this.value) {
      this.m_textInput.value = '';
      this.$emit('input', '');
    }
    this.m_errorMessage = '';
    this.m_textInputWrapper.classList.remove('is-invalid');
  }

  focus(): void {
    this.$nextTick(() => this.m_textInput.focus());
  }

  validate(): boolean {
    const result = this.m_textInput.checkValidity();
    if (!result) {
      if (this.m_textInput.value) {
        this.m_errorMessage = `${this.itemName} is a invalid.`;
      } else {
        this.m_errorMessage = `${this.itemName} is a required.`;
      }
    } else {
      this.m_errorMessage = '';
      this.m_textInputWrapper.classList.remove('is-invalid');
    }
    return result;
  }

  //----------------------------------------------------------------------
  //
  //  Event handlers
  //
  //----------------------------------------------------------------------

  m_textInputOnChange(e: Event) {
    this.errorMessage = '';
    const value = (e.target as any).value;
    this.$emit('input', value);
  }
}
</script>
