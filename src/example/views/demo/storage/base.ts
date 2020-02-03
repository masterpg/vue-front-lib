import { ChildrenSortFunc, CompTreeNodeData, StorageLogic, StorageNodeShareSettings, StorageNodeType } from '@/lib'
import { Component, Prop } from 'vue-property-decorator'
import { StorageRoute, router } from '@/example/router'
import { StorageTreeStore, newStorageTreeStore } from '@/example/views/demo/storage/storage-tree-store'
import { Dayjs } from 'dayjs'
import StorageTreeNode from '@/example/views/demo/storage/storage-tree-node.vue'
import Vue from 'vue'

export type StorageType = 'user' | 'app'

export interface StorageTreeNodeData extends CompTreeNodeData {
  icon: string
  nodeType: StorageNodeType
  contentType: string
  size: number
  share: StorageNodeShareSettings
  baseURL: string
  created: Dayjs
  updated: Dayjs
}

export const treeSortFunc: ChildrenSortFunc = (a, b) => {
  const _a = a as StorageTreeNode
  const _b = b as StorageTreeNode
  if (_a.nodeType === StorageNodeType.Dir && _b.nodeType === StorageNodeType.File) {
    return -1
  } else if (_a.nodeType === StorageNodeType.File && _b.nodeType === StorageNodeType.Dir) {
    return 1
  }
  if (_a.label < _b.label) {
    return -1
  } else if (_a.label > _b.label) {
    return 1
  } else {
    return 0
  }
}

let userTreeStore: StorageTreeStore

let appTreeStore: StorageTreeStore

@Component
export class StorageTypeMixin extends Vue {
  created() {
    switch (this.storageType) {
      case 'user':
        if (!userTreeStore) {
          userTreeStore = newStorageTreeStore(this.storageType, this.storageLogic)
        }
        this.m_treeStore = userTreeStore
        break
      case 'app':
        if (!appTreeStore) {
          appTreeStore = newStorageTreeStore(this.storageType, this.storageLogic)
        }
        this.m_treeStore = appTreeStore
        break
    }
  }

  @Prop({ required: true })
  storageType!: StorageType

  protected get storageLogic(): StorageLogic {
    switch (this.storageType) {
      case 'user':
        return this.$logic.userStorage
      case 'app':
        return this.$logic.appStorage
    }
  }

  protected get storageRoute(): StorageRoute {
    switch (this.storageType) {
      case 'user':
        return router.views.demo.userStorage
      case 'app':
        return router.views.demo.appStorage
    }
  }

  private m_treeStore!: StorageTreeStore

  protected get treeStore(): StorageTreeStore {
    return this.m_treeStore
  }
}
