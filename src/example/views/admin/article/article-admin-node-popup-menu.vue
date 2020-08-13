<style lang="sass" scoped>
@import 'src/example/styles/app.variables'
</style>

<template>
  <q-menu ref="menu" :touch-position="contextMenu" :context-menu="contextMenu" @before-show="m_menuOnBeforeShow">
    <!-- 記事ルート用メニュー -->
    <q-list v-show="isRoot" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.root" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
    <!-- 複数選択用メニュー -->
    <q-list v-show="m_isMulti" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.multi" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
    <!-- リストバンドル用メニュー -->
    <q-list v-show="m_isListBundle" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.listBundle" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
    <!-- カテゴリバンドル用メニュー -->
    <q-list v-show="m_isCategoryBundle" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.categoryBundle" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
    <!-- カテゴリ用メニュー -->
    <q-list v-show="m_isCategoryDir" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.categoryDir" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
    <!-- 記事用メニュー -->
    <q-list v-show="m_isArticleDir" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.articleDir" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { BaseComponent, NoCache, StorageArticleNodeType, StorageNodeType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { ArticleAdminNodeActionType } from './base'
import { QMenu } from 'quasar'
import { StorageNodeActionEvent } from '../../base/storage'

@Component({
  components: {},
})
export default class ArticleAdminNodePopupMenu extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  node!: { path: string; nodeType: StorageNodeType; articleNodeType: StorageArticleNodeType }

  @Prop({ default: null })
  selectedNodes!: { path: string; nodeType: StorageNodeType }[] | null

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

  private m_menuItems = {
    root: [ArticleAdminNodeActionType.createListBundle, ArticleAdminNodeActionType.createCategoryBundle],
    listBundle: [ArticleAdminNodeActionType.createArticleDir],
    categoryBundle: [ArticleAdminNodeActionType.createCategoryDir, ArticleAdminNodeActionType.createArticleDir],
    categoryDir: [ArticleAdminNodeActionType.createCategoryDir, ArticleAdminNodeActionType.createArticleDir],
    articleDir: [],
  }

  private get m_isMulti(): boolean {
    if (this.selectedNodes) {
      return this.selectedNodes.length > 1
    } else {
      return false
    }
  }

  private get m_isListBundle(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.articleNodeType === StorageArticleNodeType.ListBundle
  }

  private get m_isCategoryBundle(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.articleNodeType === StorageArticleNodeType.CategoryBundle
  }

  private get m_isCategoryDir(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.articleNodeType === StorageArticleNodeType.CategoryDir
  }

  private get m_isArticleDir(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.articleNodeType === StorageArticleNodeType.ArticleDir
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
