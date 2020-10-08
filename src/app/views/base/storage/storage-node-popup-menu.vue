<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <q-menu ref="menu" :touch-position="contextMenu" :context-menu="contextMenu" @before-show="m_menuOnBeforeShow">
    <q-list dense style="min-width: 100px;">
      <template v-for="(menuItem, index) in m_menuItems">
        <q-separator v-if="menuItem.type === 'separator'" :key="index" />
        <q-item v-else :key="index" v-close-popup clickable>
          <q-item-section @click="m_menuItemOnClick(menuItem)">{{ menuItem.label }}</q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { BaseComponent, NoCache } from '@/app/base'
import { Component, Prop } from 'vue-property-decorator'
import { StorageArticleNodeType, StorageNodeType } from '@/app/logic'
import { StorageNodeActionEvent as _StorageNodeActionEvent, StorageNodeActionType as _StorageNodeActionType } from '@/app/views/base/storage/base'
import { QMenu } from 'quasar'
import { StoragePageMixin } from '@/app/views/base/storage/storage-page-mixin'
import { mixins } from 'vue-class-component'

interface Node {
  path: string
  nodeType: StorageNodeType
  articleNodeType: StorageArticleNodeType
}

type StorageNodeActionType = _StorageNodeActionType | 'separator'

class StorageNodeActionEvent extends _StorageNodeActionEvent<StorageNodeActionType> {}

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

  private get m_menuItems(): StorageNodeActionEvent[] {
    // ストレージ系メニュー
    if (this.m_isStorage) {
      // 複数選択用メニュー
      if (this.m_isMulti) {
        return [
          new StorageNodeActionEvent('move', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
        ]
      }
      // ルートノード用メニュー
      else if (this.isRoot) {
        return [
          new StorageNodeActionEvent('createDir', this.m_selectedNodePaths),
          new StorageNodeActionEvent('uploadDir', this.m_selectedNodePaths),
          new StorageNodeActionEvent('uploadFiles', this.m_selectedNodePaths),
          new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
        ]
      }
      // フォルダ用メニュー
      else if (this.m_isStorageDir) {
        return [
          new StorageNodeActionEvent('createDir', this.m_selectedNodePaths),
          new StorageNodeActionEvent('uploadDir', this.m_selectedNodePaths),
          new StorageNodeActionEvent('uploadFiles', this.m_selectedNodePaths),
          new StorageNodeActionEvent('move', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
          new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
        ]
      }
      // ファイル用メニュー
      else if (this.m_isStorageFile) {
        return [
          new StorageNodeActionEvent('move', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
        ]
      }
    }
    // 記事系メニュー
    else {
      // 複数選択用メニュー
      if (this.m_isMulti) {
        const result = [
          new StorageNodeActionEvent('move', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
        ]
        if (this.m_containsBundle(this.selectedNodes!)) {
          const index = result.findIndex(e => e.type === 'move')
          index >= 0 && result.splice(index, 1)
        }
        if (this.m_containsAssetsDir(this.selectedNodes!)) {
          const index = result.findIndex(e => e.type === 'delete')
          index >= 0 && result.splice(index, 1)
        }
        return result
      }
      // 記事ルート用メニュー
      else if (this.isRoot) {
        return [
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.ListBundle),
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.CategoryBundle),
        ]
      }
      // リストバンドル用メニュー
      else if (this.m_isListBundle) {
        return [
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.Article),
          new StorageNodeActionEvent('separator', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
          new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
        ]
      }
      // カテゴリバンドル用メニュー
      else if (this.m_isCategoryBundle) {
        return [
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.Category),
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.Article),
          new StorageNodeActionEvent('separator', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
          new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
        ]
      }
      // カテゴリ用メニュー
      else if (this.m_isCategory) {
        return [
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.Category),
          new StorageNodeActionEvent('createArticleTypeDir', this.m_selectedNodePaths, StorageArticleNodeType.Article),
          new StorageNodeActionEvent('separator', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
          new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
        ]
      }
      // 記事用メニュー
      else if (this.m_isArticle) {
        return [
          new StorageNodeActionEvent('createDir', this.m_selectedNodePaths),
          new StorageNodeActionEvent('uploadDir', this.m_selectedNodePaths),
          new StorageNodeActionEvent('uploadFiles', this.m_selectedNodePaths),
          new StorageNodeActionEvent('move', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
          new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
        ]
      }
      // フォルダ用メニュー
      else if (this.m_isStorageDir) {
        if (this.m_isAssetsDir) {
          return [
            new StorageNodeActionEvent('createDir', this.m_selectedNodePaths),
            new StorageNodeActionEvent('uploadDir', this.m_selectedNodePaths),
            new StorageNodeActionEvent('uploadFiles', this.m_selectedNodePaths),
            new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
          ]
        } else {
          return [
            new StorageNodeActionEvent('createDir', this.m_selectedNodePaths),
            new StorageNodeActionEvent('uploadDir', this.m_selectedNodePaths),
            new StorageNodeActionEvent('uploadFiles', this.m_selectedNodePaths),
            new StorageNodeActionEvent('move', this.m_selectedNodePaths),
            new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
            new StorageNodeActionEvent('share', this.m_selectedNodePaths),
            new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
            new StorageNodeActionEvent('reload', this.m_selectedNodePaths),
          ]
        }
      }
      // ファイル用メニュー
      else if (this.m_isStorageFile) {
        return [
          new StorageNodeActionEvent('move', this.m_selectedNodePaths),
          new StorageNodeActionEvent('rename', this.m_selectedNodePaths),
          new StorageNodeActionEvent('share', this.m_selectedNodePaths),
          new StorageNodeActionEvent('delete', this.m_selectedNodePaths),
        ]
      }
    }

    return []
  }

  private get m_selectedNodePaths(): string[] {
    return this.selectedNodes ? this.selectedNodes.map(node => node.path) : [this.node.path]
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

  private m_menuItemOnClick(e: StorageNodeActionEvent) {
    this.$emit('select', e)
  }
}
</script>
