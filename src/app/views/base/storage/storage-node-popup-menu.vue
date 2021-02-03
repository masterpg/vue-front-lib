<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <q-menu ref="menu" class="StorageNodePopupMenu" :touch-position="contextMenu" :context-menu="contextMenu" @before-show="menuOnBeforeShow">
    <q-list dense style="min-width: 100px">
      <template v-for="(menuItem, index) in menuItems">
        <q-separator v-if="menuItem.type === 'separator'" :key="index" />
        <q-item v-else :key="index" v-close-popup clickable>
          <q-item-section @click="menuItemOnClick(menuItem)">{{ menuItem.label }}</q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { StorageArticleDirType, StorageNodeType, StorageType } from '@/app/service'
import { computed, defineComponent, ref } from '@vue/composition-api'
import { QMenu } from 'quasar'
import { StorageNodeActionEvent } from '@/app/views/base/storage/base'
import { StoragePageService } from '@/app/views/base/storage/storage-page-service'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface StorageNodePopupMenu extends StorageNodePopupMenu.Props {}

interface Node {
  path: string
  nodeType: StorageNodeType
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageNodePopupMenu {
  export interface Props {
    readonly storageType: StorageType
    readonly node: Node
    readonly selectedNodes: Node[] | null
    readonly isRoot: boolean
    readonly disabled: boolean
    readonly contextMenu: boolean
  }

  export const clazz = defineComponent({
    name: 'StorageNodePopupMenu',

    props: {
      storageType: { type: String, require: true },
      node: { type: Object, require: true },
      selectedNodes: { type: Array, default: null },
      isRoot: { type: Boolean, default: false },
      disabled: { type: Boolean, default: false },
      contextMenu: { type: Boolean, default: false },
    },

    setup(props: Props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const menu = ref<QMenu>()

      const pageService = StoragePageService.getInstance(props.storageType)

      const menuItems = computed<StorageNodeActionEvent[]>(() => {
        //
        // ストレージ系メニュー
        //
        if (isStorage.value) {
          // 複数選択用メニュー
          if (isMulti.value) {
            return [
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
            ]
          }
          // ルートノード用メニュー
          else if (props.isRoot) {
            return [
              new StorageNodeActionEvent('createDir', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('uploadDir', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('uploadFiles', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
            ]
          }
          // フォルダ用メニュー
          else if (isStorageDir.value) {
            return [
              new StorageNodeActionEvent('createDir', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('uploadDir', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('uploadFiles', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
            ]
          }
          // ファイル用メニュー
          else if (isStorageFile.value) {
            return [
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
            ]
          }
        }
        //
        // 記事系メニュー
        //
        else {
          // 複数選択用メニュー
          if (isMulti.value) {
            const result = [
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
            ]
            if (containsBundle(props.selectedNodes!)) {
              const index = result.findIndex(e => e.type === 'move')
              index >= 0 && result.splice(index, 1)
            }
            if (containsAssetsDir(props.selectedNodes!)) {
              const index = result.findIndex(e => e.type === 'delete')
              index >= 0 && result.splice(index, 1)
            }
            return result
          }
          // 記事ルート用メニュー
          else if (props.isRoot) {
            return [
              new StorageNodeActionEvent('createArticleTypeDir', { parentPath: selectedNodePaths.value[0], type: StorageArticleDirType.ListBundle }),
              new StorageNodeActionEvent('createArticleTypeDir', {
                parentPath: selectedNodePaths.value[0],
                type: StorageArticleDirType.TreeBundle,
              }),
            ]
          }
          // リストバンドル用メニュー
          else if (isListBundle.value) {
            return [
              new StorageNodeActionEvent('createArticleTypeDir', { parentPath: selectedNodePaths.value[0], type: StorageArticleDirType.Article }),
              new StorageNodeActionEvent('separator', undefined),
              new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
            ]
          }
          // ツリーバンドル用メニュー
          else if (isTreeBundle.value) {
            return [
              new StorageNodeActionEvent('createArticleTypeDir', { parentPath: selectedNodePaths.value[0], type: StorageArticleDirType.Category }),
              new StorageNodeActionEvent('createArticleTypeDir', { parentPath: selectedNodePaths.value[0], type: StorageArticleDirType.Article }),
              new StorageNodeActionEvent('separator', undefined),
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
            ]
          }
          // カテゴリ用メニュー
          else if (isCategoryDir.value) {
            return [
              new StorageNodeActionEvent('createArticleTypeDir', { parentPath: selectedNodePaths.value[0], type: StorageArticleDirType.Category }),
              new StorageNodeActionEvent('createArticleTypeDir', { parentPath: selectedNodePaths.value[0], type: StorageArticleDirType.Article }),
              new StorageNodeActionEvent('separator', undefined),
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
            ]
          }
          // 記事用メニュー
          else if (isArticleDir.value) {
            return [
              new StorageNodeActionEvent('createDir', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('uploadDir', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('uploadFiles', { parentPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
              new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
              new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
            ]
          }
          // フォルダ用メニュー
          else if (isStorageDir.value) {
            if (isAssetsDir.value) {
              return [
                new StorageNodeActionEvent('createDir', { parentPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('uploadDir', { parentPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('uploadFiles', { parentPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
              ]
            } else {
              return [
                new StorageNodeActionEvent('createDir', { parentPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('uploadDir', { parentPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('uploadFiles', { parentPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
                new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
                new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
                new StorageNodeActionEvent('reload', { targetPath: selectedNodePaths.value[0] }),
              ]
            }
          }
          // ファイル用メニュー
          else if (isStorageFile.value) {
            if (isArticleMasterSrc.value) {
              return []
            } else {
              return [
                new StorageNodeActionEvent('move', { targetPaths: selectedNodePaths.value }),
                new StorageNodeActionEvent('rename', { targetPath: selectedNodePaths.value[0] }),
                new StorageNodeActionEvent('share', { targetPaths: selectedNodePaths.value }),
                new StorageNodeActionEvent('delete', { targetPaths: selectedNodePaths.value }),
              ]
            }
          }
        }

        return []
      })

      const selectedNodePaths = computed(() => {
        return props.selectedNodes ? props.selectedNodes.map(node => node.path) : [props.node.path]
      })

      const isStorage = computed(() => {
        switch (props.storageType) {
          case 'app':
          case 'user':
            return true
          default:
            return false
        }
      })

      const isMulti = computed(() => {
        if (props.selectedNodes) {
          return props.selectedNodes.length > 1
        } else {
          return false
        }
      })

      const isStorageDir = computed(() => {
        return !props.isRoot && !isMulti.value && props.node.nodeType === StorageNodeType.Dir
      })

      const isStorageFile = computed(() => {
        return !props.isRoot && !isMulti.value && props.node.nodeType === StorageNodeType.File
      })

      const isListBundle = computed(() => {
        return !props.isRoot && !isMulti.value && pageService.isListBundle(props.node)
      })

      const isTreeBundle = computed(() => {
        return !props.isRoot && !isMulti.value && pageService.isTreeBundle(props.node)
      })

      const isCategoryDir = computed(() => {
        return !props.isRoot && !isMulti.value && pageService.isCategoryDir(props.node)
      })

      const isArticleDir = computed(() => {
        return !props.isRoot && !isMulti.value && pageService.isArticleDir(props.node)
      })

      const isAssetsDir = computed(() => {
        return !props.isRoot && !isMulti.value && pageService.isAssetsDir(props.node)
      })

      const isArticleMasterSrc = computed(() => {
        return !props.isRoot && !isMulti.value && pageService.isArticleMasterSrc(props.node)
      })

      const enabled = computed(() => {
        if (props.disabled) return false
        if (!menuItems.value.length) return false
        if (!pageService.isSignedIn.value) return false

        if (props.selectedNodes) {
          return props.selectedNodes.length > 0 && props.selectedNodes.includes(props.node)
        } else {
          return true
        }
      })

      //----------------------------------------------------------------------
      //
      //  Internal methods
      //
      //----------------------------------------------------------------------

      function containsBundle(nodes: Node[]): boolean {
        for (const node of nodes) {
          if (pageService.isListBundle(node) || pageService.isTreeBundle(node)) {
            return true
          }
        }
        return false
      }

      function containsAssetsDir(nodes: Node[]): boolean {
        for (const node of nodes) {
          if (pageService.isAssetsDir(node)) {
            return true
          }
        }
        return false
      }

      //----------------------------------------------------------------------
      //
      //  Event listeners
      //
      //----------------------------------------------------------------------

      function menuOnBeforeShow() {
        if (!enabled.value) {
          menu.value!.hide()
        }
      }

      function menuItemOnClick(e: StorageNodeActionEvent) {
        ctx.emit('select', e)
      }

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        menu,
        menuItems,
        containsBundle,
        menuOnBeforeShow,
        menuItemOnClick,
      }
    },
  })
}

//========================================================================
//
//  Exports
//
//========================================================================

export default StorageNodePopupMenu.clazz
export { StorageNodePopupMenu }
</script>
