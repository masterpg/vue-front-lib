<style lang="sass" scoped>
@import 'src/example/styles/app.variables'
</style>

<template>
  <q-menu ref="menu" touch-position context-menu @before-show="m_menuOnBeforeShow">
    <!-- ルートノード用メニュー -->
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
    <!-- フォルダ用メニュー -->
    <q-list v-show="m_isDir" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.dir" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
    <!-- ファイル用メニュー -->
    <q-list v-show="m_isFile" dense style="min-width: 100px;">
      <q-item v-for="menuItem of m_menuItems.file" :key="menuItem.type" v-close-popup clickable>
        <q-item-section @click="m_menuItemOnClick(menuItem.type)">{{ menuItem.label }}</q-item-section>
      </q-item>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { BaseComponent, NoCache, StorageNodeType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageNodeContextMenuSelectedEvent, StorageNodeContextMenuType } from './base'
import { QMenu } from 'quasar'

@Component({
  components: {},
})
export default class StorageNodeContextMenu extends BaseComponent {
  //----------------------------------------------------------------------
  //
  //  Properties
  //
  //----------------------------------------------------------------------

  @Prop({ required: true })
  node!: { path: string; nodeType: StorageNodeType }

  @Prop({ default: null })
  selectedNodes!: { path: string; nodeType: StorageNodeType }[] | null

  @Prop({ default: false })
  isRoot!: boolean

  @Prop({ default: false })
  disabled!: boolean

  //----------------------------------------------------------------------
  //
  //  Variables
  //
  //----------------------------------------------------------------------

  private m_menuItems = {
    root: [
      StorageNodeContextMenuType.createDir,
      StorageNodeContextMenuType.uploadDir,
      StorageNodeContextMenuType.uploadFiles,
      StorageNodeContextMenuType.reload,
    ],
    dir: [
      StorageNodeContextMenuType.createDir,
      StorageNodeContextMenuType.uploadDir,
      StorageNodeContextMenuType.uploadFiles,
      StorageNodeContextMenuType.move,
      StorageNodeContextMenuType.rename,
      StorageNodeContextMenuType.share,
      StorageNodeContextMenuType.deletion,
      StorageNodeContextMenuType.reload,
    ],
    file: [StorageNodeContextMenuType.move, StorageNodeContextMenuType.rename, StorageNodeContextMenuType.share, StorageNodeContextMenuType.deletion],
    multi: [StorageNodeContextMenuType.move, StorageNodeContextMenuType.share, StorageNodeContextMenuType.deletion],
  }

  private get m_isMulti(): boolean {
    if (this.selectedNodes) {
      return this.selectedNodes.length > 1
    } else {
      return false
    }
  }

  private get m_isDir(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.nodeType === StorageNodeType.Dir
  }

  private get m_isFile(): boolean {
    return !this.isRoot && !this.m_isMulti && this.node.nodeType === StorageNodeType.File
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
    const event: StorageNodeContextMenuSelectedEvent = { type, nodePaths }
    this.$emit('select', event)
  }
}
</script>
