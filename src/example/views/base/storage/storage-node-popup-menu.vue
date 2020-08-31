<style lang="sass" scoped>
@import 'src/example/styles/app.variables'
</style>

<template>
  <q-menu ref="menu" :touch-position="contextMenu" :context-menu="contextMenu" @before-show="m_menuOnBeforeShow">
    <q-list dense style="min-width: 100px;">
      <template v-for="(menuItem, index) in m_menuItems">
        <q-separator v-if="menuItem.type === 'separator'" :key="index" />
        <q-item v-else :key="index" v-close-popup clickable>
          <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { BaseComponent, NoCache, StorageArticleNodeType, StorageNodeType, StorageType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageNodeActionEvent, StorageNodeActionType } from './base'
import { QMenu } from 'quasar'
import { StoragePageMixin } from './storage-page-mixin'
import { mixins } from 'vue-class-component'

interface Node {
  path: string
  nodeType: StorageNodeType
  articleNodeType: StorageArticleNodeType
}

@Component({
  components: {},
})
export default class StorageNodePopupMenu extends mixins(BaseComponent, StoragePageMixin) {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  node!: Node

  @Prop({ default: null })
  selectedNodes!: Node[] | null

  @Prop({ default: false, type: Boolean })
  isRoot!: boolean

  @Prop({ default: false, type: Boolean })
  disabled!: boolean

  @Prop({ default: false, type: Boolean })
  contextMenu!: boolean

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private get m_menuItems(): StorageNodeActionType[] {
    // ストレージ系メニュー
    if (this.m_isStorage) {
      // 複数選択用メニュー
      if (this.m_isMulti) {
        return [StorageNodeActionType.move, StorageNodeActionType.share, StorageNodeActionType.deletion]
      }
      // ルートノード用メニュー
      else if (this.isRoot) {
        return [StorageNodeActionType.createDir, StorageNodeActionType.uploadDir, StorageNodeActionType.uploadFiles, StorageNodeActionType.reload]
      }
      // フォルダ用メニュー
      else if (this.m_isStorageDir) {
        return [
          StorageNodeActionType.createDir,
          StorageNodeActionType.uploadDir,
          StorageNodeActionType.uploadFiles,
          StorageNodeActionType.move,
          StorageNodeActionType.rename,
          StorageNodeActionType.share,
          StorageNodeActionType.deletion,
          StorageNodeActionType.reload,
        ]
      }
      // ファイル用メニュー
      else if (this.m_isStorageFile) {
        return [StorageNodeActionType.move, StorageNodeActionType.rename, StorageNodeActionType.share, StorageNodeActionType.deletion]
      }
    }
    // 記事系メニュー
    else {
      // 複数選択用メニュー
      if (this.m_isMulti) {
        const result = [StorageNodeActionType.move, StorageNodeActionType.share, StorageNodeActionType.deletion]
        if (this.m_containsBundle(this.selectedNodes!)) {
          const index = result.indexOf(StorageNodeActionType.move)
          index >= 0 && result.splice(index, 1)
        }
        if (this.m_containsAssetsDir(this.selectedNodes!)) {
          const index = result.indexOf(StorageNodeActionType.deletion)
          index >= 0 && result.splice(index, 1)
        }
        return result
      }
      // 記事ルート用メニュー
      else if (this.isRoot) {
        return [StorageNodeActionType.createListBundle, StorageNodeActionType.createCategoryBundle]
      }
      // リストバンドル用メニュー
      else if (this.m_isListBundle) {
        return [
          StorageNodeActionType.createArticleDir,
          StorageNodeActionType.separator,
          StorageNodeActionType.rename,
          StorageNodeActionType.share,
          StorageNodeActionType.deletion,
          StorageNodeActionType.reload,
        ]
      }
      // カテゴリバンドル用メニュー
      else if (this.m_isCategoryBundle) {
        return [
          StorageNodeActionType.createCategoryDir,
          StorageNodeActionType.createArticleDir,
          StorageNodeActionType.separator,
          StorageNodeActionType.rename,
          StorageNodeActionType.share,
          StorageNodeActionType.deletion,
          StorageNodeActionType.reload,
        ]
      }
      // カテゴリ用メニュー
      else if (this.m_isCategory) {
        return [
          StorageNodeActionType.createCategoryDir,
          StorageNodeActionType.createArticleDir,
          StorageNodeActionType.separator,
          StorageNodeActionType.move,
          StorageNodeActionType.rename,
          StorageNodeActionType.share,
          StorageNodeActionType.deletion,
          StorageNodeActionType.reload,
        ]
      }
      // 記事用メニュー
      else if (this.m_isArticle) {
        return [
          StorageNodeActionType.uploadDir,
          StorageNodeActionType.uploadFiles,
          StorageNodeActionType.move,
          StorageNodeActionType.rename,
          StorageNodeActionType.share,
          StorageNodeActionType.deletion,
          StorageNodeActionType.reload,
        ]
      }
      // フォルダ用メニュー
      else if (this.m_isStorageDir) {
        if (this.m_isAssetsDir) {
          return [StorageNodeActionType.createDir, StorageNodeActionType.uploadDir, StorageNodeActionType.uploadFiles, StorageNodeActionType.reload]
        } else {
          return [
            StorageNodeActionType.createDir,
            StorageNodeActionType.uploadDir,
            StorageNodeActionType.uploadFiles,
            StorageNodeActionType.move,
            StorageNodeActionType.rename,
            StorageNodeActionType.share,
            StorageNodeActionType.deletion,
            StorageNodeActionType.reload,
          ]
        }
      }
      // ファイル用メニュー
      else if (this.m_isStorageFile) {
        return [StorageNodeActionType.move, StorageNodeActionType.rename, StorageNodeActionType.share, StorageNodeActionType.deletion]
      }
    }

    return []
  }

  private get m_isStorage(): boolean {
    switch (this.storageType) {
      case 'app':
      case 'user':
        return true
      default:
        return false
    }
  }

  private get m_isMulti(): boolean {
    if (this.selectedNodes) {
      return this.selectedNodes.length > 1
    } else {
      return false
    }
  }

  private get m_isStorageDir(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.nodeType === StorageNodeType.Dir
  }

  private get m_isStorageFile(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.nodeType === StorageNodeType.File
  }

  private get m_isListBundle(): boolean {
    return !this.isRoot && !this.m_isMulti && this.isListBundle(this.node)
  }

  private get m_isCategoryBundle(): boolean {
    return !this.isRoot && !this.m_isMulti && this.isCategoryBundle(this.node)
  }

  private get m_isCategory(): boolean {
    return !this.isRoot && !this.m_isMulti && this.isCategory(this.node)
  }

  private get m_isArticle(): boolean {
    return !this.isRoot && !this.m_isMulti && this.isArticle(this.node)
  }

  private get m_isAssetsDir(): boolean {
    return !this.isRoot && !this.m_isMulti && this.isAssetsDir(this.node)
  }

  private get m_enabled(): boolean {
    if (this.disabled) return false
    if (!this.$logic.auth.isSignedIn) return false

    if (this.selectedNodes) {
      return this.selectedNodes.length > 0 && this.selectedNodes.includes(this.node)
    } else {
      return true
    }
  }

  private m_containsBundle(nodes: Node[]): boolean {
    for (const node of nodes) {
      if (this.isListBundle(node) || this.isCategoryBundle(node)) {
        return true
      }
    }
    return false
  }

  private m_containsAssetsDir(nodes: Node[]): boolean {
    for (const node of nodes) {
      if (this.isAssetsDir(node)) {
        return true
      }
    }
    return false
  }

  //--------------------------------------------------
  //  Elements
  //--------------------------------------------------

  @NoCache
  private get m_menu(): QMenu {
    return this.$refs.menu as QMenu
  }

  //----------------------------------------------------------------------
  //
  //  Event listeners
  //
  //----------------------------------------------------------------------

  private m_menuOnBeforeShow() {
    if (!this.m_enabled) {
      this.m_menu.hide()
    }
  }

  private m_menuItemOnClick(type: string) {
    const nodePaths = this.selectedNodes ? this.selectedNodes.map(node => node.path) : [this.node.path]
    const event: StorageNodeActionEvent = { type, nodePaths }
    this.$emit('select', event)
  }
}
</script>
