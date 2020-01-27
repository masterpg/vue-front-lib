<style lang="sass" scoped>
@import '../../../styles/app.variables'

.storage-file-node-view-main
  width: 100%
  padding: 0 16px 16px 32px
  > *:not(:first-child)
    margin-top: 20px

.file-name
  @extend %text-h6
  word-break: break-all

.img
  --comp-img-max-height: 300px

.item
  @extend %layout-horizontal
  &:not(:first-child)
    margin-top: 10px
  .title
    @extend %app-item-title
    width: 100px
  .value
    @extend %app-item-value
    @extend %layout-flex-1
    word-break: break-all
</style>

<template>
  <div class="storage-file-node-view-main layout vertical">
    <div class="layout horizontal center">
      <div class="file-name flex-1">{{ m_fileName }}</div>
      <q-btn flat round color="primary" icon="close" @click="m_closeOnClick" />
    </div>
    <div v-show="m_isImage" class="layout vertical center">
      <comp-img :src="m_url" class="img" />
    </div>
    <q-input v-show="m_isText" v-model="m_textData" type="textarea" readonly filled />
    <div class="layout vertical">
      <div class="item">
        <div class="title">{{ this.$t('storage.nodeDetail.url') }}</div>
        <div class="value">{{ m_url }}</div>
      </div>
      <div class="item">
        <div class="title">{{ this.$t('storage.nodeDetail.path') }}</div>
        <div class="value">{{ m_path }}</div>
      </div>
      <div class="item">
        <div class="title">{{ this.$t('storage.nodeDetail.type') }}</div>
        <div class="value">{{ m_contentType }}</div>
      </div>
      <div class="item">
        <div class="title">{{ this.$t('storage.nodeDetail.size') }}</div>
        <div class="value">{{ m_size }} ({{ m_bytes }} bytes)</div>
      </div>
      <div class="item">
        <div class="title">{{ this.$t('storage.nodeDetail.share') }}</div>
        <div class="value">{{ m_share }}</div>
      </div>
      <div class="item">
        <div class="title">{{ this.$t('storage.nodeDetail.updated') }}</div>
        <div class="value">{{ m_updated }}</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { BaseComponent, Resizable } from '../../../../lib/base/component'
import { CompImg } from '@/lib'
import { Component } from 'vue-property-decorator'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import { StorageTypeMixin } from '@/example/views/demo/storage/base'
import axios from 'axios'
import bytes from 'bytes'
import { mixins } from 'vue-class-component'
import { removeBothEndsSlash } from 'web-base-lib'

@Component({
  components: { CompImg },
})
export default class StorageNodeDetailView extends mixins(BaseComponent, Resizable, StorageTypeMixin) {
  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_nodePath: string | null = null

  private m_fileNode: StorageTreeNode | null = null

  private get m_isImage(): boolean {
    if (!this.m_fileNode) return false
    return this.m_fileNode.contentType.startsWith('image/')
  }

  private get m_isText(): boolean {
    if (!this.m_fileNode) return false
    return this.m_fileNode.contentType.startsWith('text/')
  }

  private get m_url(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.fileURL
  }

  private get m_fileName(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.label
  }

  private get m_contentType(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.contentType
  }

  private get m_size(): string {
    if (!this.m_fileNode) return ''
    return bytes(this.m_fileNode.size)
  }

  private get m_share(): string {
    if (!this.m_fileNode) return ''
    if (this.m_fileNode.share.isPublic) {
      return String(this.$t('storage.share.public'))
    } else {
      return String(this.$t('storage.share.private'))
    }
  }

  private get m_bytes(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.size.toLocaleString()
  }

  private get m_path(): string {
    if (!this.m_fileNode) return ''
    return this.m_fileNode.value
  }

  private get m_updated(): string {
    if (!this.m_fileNode) return ''
    return String(this.$d(this.m_fileNode.updatedDate.toDate(), 'dateSec'))
  }

  private m_textData: string | null = null

  //----------------------------------------------------------------------
  //
  //  Methods
  //
  //----------------------------------------------------------------------

  /**
   * ビューに表示するノードのパスを設定します。
   * @param nodePath
   */
  setNodePath(nodePath: string): void {
    const clear = () => {
      this.m_fileNode = null
      this.m_textData = ''
    }

    nodePath = removeBothEndsSlash(nodePath)
    if (this.m_nodePath !== nodePath) {
      clear()
    }

    this.m_nodePath = nodePath
    this.m_fileNode = this.treeStore.getNode(nodePath)!

    if (this.m_isText) {
      this.m_loadTextFile(this.m_url)
    }
  }

  //----------------------------------------------------------------------
  //
  //  Internal methods
  //
  //----------------------------------------------------------------------

  private async m_loadTextFile(fileURL: string): Promise<void> {
    const response = await axios.request({
      url: fileURL,
      method: 'get',
      responseType: 'text',
    })
    this.m_textData = response.data
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_closeOnClick() {
    this.$emit('close')
  }
}
</script>
