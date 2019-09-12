import { GQLStorageNode, gql } from '@/gql'
import { StorageLogic, StorageNode, StorageNodeBag } from '@/logic'
import { BaseLogic } from '@/logic/base'
import { Component } from 'vue-property-decorator'
import { config } from '@/base/config'

@Component
export class StorageLogicImpl extends BaseLogic implements StorageLogic {
  toURL(path: string): string {
    path = path.replace(/^\//, '')
    return `${config.api.baseURL}/storage/${path}`
  }

  async getUserNodes(dirPath?: string): Promise<StorageNodeBag> {
    const gqlNodes = await gql.userStorageNodes(dirPath)
    return this.m_toStorageNodeBag(gqlNodes)
  }

  async createStorageDir(dirPath: string): Promise<StorageNodeBag> {
    const gqlNodes = await gql.createStorageDir(dirPath)
    return this.m_toStorageNodeBag(gqlNodes)
  }

  async removeStorageNodes(nodePaths: string[]): Promise<StorageNodeBag> {
    const gqlNodes = await gql.removeStorageNodes(nodePaths)
    return this.m_toStorageNodeBag(gqlNodes)
  }

  private m_toStorageNodeBag(gqlNodes: GQLStorageNode[]): StorageNodeBag {
    const bag = { list: [], map: {} } as StorageNodeBag

    for (const gqlNode of gqlNodes) {
      const node = this.m_toStorageNode(gqlNode)
      bag.list.push(node)
      bag.map[node.path] = node
    }

    for (const node of bag.list) {
      const parent = bag.map[node.dir]
      if (parent) {
        parent.children.push(node)
        node.parent = parent
      }
    }

    return bag
  }

  private m_toStorageNode(gqlNode: GQLStorageNode): StorageNode {
    return {
      nodeType: gqlNode.nodeType,
      name: gqlNode.name,
      dir: gqlNode.dir,
      path: gqlNode.path,
      children: [],
    }
  }
}
