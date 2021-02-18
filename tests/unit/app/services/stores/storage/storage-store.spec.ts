import { DeepReadonly, removeStartDirChars } from 'web-base-lib'
import { GeneralUser, cloneStorageNode, newStorageDirNode, newStorageFileNode, provideDependency } from '../../../../../helpers/app'
import { StorageArticleDirType, StorageArticleFileType, StorageNode, StorageNodeShareSettings, StorageNodeType, StorageUtil } from '@/app/services'
import dayjs from 'dayjs'
import path from 'path'
import { useConfig } from '@/app/config'

//========================================================================
//
//  Test helpers
//
//========================================================================

function getStateNode(path: string): StorageNode | undefined {
  const { stores } = provideDependency()
  for (const node of stores.storage.state.all) {
    if (node.path === path) return node
  }
  return undefined
}

function existsStateNodes(value: DeepReadonly<StorageNode> | DeepReadonly<StorageNode>[]): void {
  const nodes = Array.isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (!exists) {
      throw new Error(`The state node was not found: '${node.path}'`)
    }
  }
}

function notExistsStateNodes(value: DeepReadonly<StorageNode> | DeepReadonly<StorageNode>[]) {
  const nodes = Array.isArray(value) ? (value as StorageNode[]) : [value as StorageNode]
  for (const node of nodes) {
    const exists = getStateNode(node.path)
    if (exists) {
      throw new Error(`The state node exists: '${node.path}'`)
    }
  }
}

function verifyStateNodes() {
  const { stores } = provideDependency()
  for (const node of stores.storage.state.all) {
    const expectName = path.basename(node.path)
    const expectDir = removeStartDirChars(path.dirname(node.path))
    const expectPath = path.join(expectDir, expectName)
    expect(node.name).toBe(expectName)
    expect(node.dir).toBe(expectDir)
    expect(node.path).toBe(expectPath)
    if (node.nodeType === 'Dir') {
      expect(node.contentType).toBe('')
      expect(node.size).toBe(0)
    } else if (node.nodeType === 'File') {
      expect(node.contentType).toBeDefined()
      expect(node.size).toBeGreaterThan(0)
    }
    if (node.article?.dir) {
      expect(typeof node.article.dir.name === 'string').toBeTruthy()
      expect(typeof node.article.dir.type === 'string').toBeTruthy()
      expect(node.article.dir.sortOrder).toBeGreaterThan(0)
    }
    if (node.article?.file) {
      expect(typeof node.article.file.type === 'string').toBeTruthy()
    }
    expect(node.createdAt).toBeDefined()
    expect(node.updatedAt).toBeDefined()
  }
}

/**
 * 指定されたアイテムがストアのコピーであることを検証します。
 * @param actual
 */
function toBeCopy<T extends DeepReadonly<StorageNode>>(actual: T | T[]): void {
  const nodes = Array.isArray(actual) ? (actual as T[]) : [actual as T]
  for (const node of nodes) {
    const stateNode = getStateNode(node.path)
    expect(node).not.toBe(stateNode)
  }
}

//========================================================================
//
//  Tests
//
//========================================================================

describe('StorageStore', () => {
  describe('all', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const d111 = newStorageDirNode('d1/d11/d111')
      const f1111 = newStorageFileNode('d1/d11/d111/f1111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const f11 = newStorageFileNode('d1/f11.txt')
      const d2 = newStorageDirNode('d2')
      const d21 = newStorageDirNode('d2/d21')
      const f211 = newStorageFileNode('d2/d21/f211.txt')
      const f1 = newStorageFileNode('f1.txt')
      const all = [d1, d11, d111, f1111, d12, f11, d2, d21, f211, f1]
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll(all)
      })

      // テスト対象実行
      const actual = stores.storage.all.value

      expect(actual).toEqual(all)
    })
  })

  describe('get', () => {
    it('ベーシックケース - id検索', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const all = [d1, d11, f111, d12, d2]
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll(all)
      })

      const actual = stores.storage.get({ id: d11.id })!

      expect(actual).toEqual(d11)
      toBeCopy(actual)
    })

    it('ベーシックケース - path検索', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.get({ path: d11.path })!

      expect(actual).toEqual(d11)
      toBeCopy(actual)
    })

    it('idとpath両方指定しなかった場合', () => {
      const { stores } = provideDependency()

      const actual = stores.storage.get({})

      expect(actual).toBeUndefined()
    })

    it('pathに空文字を指定した場合', () => {
      const { stores } = provideDependency()

      const actual = stores.storage.get({ path: '' })

      expect(actual).toBeUndefined()
    })
  })

  describe('getList', () => {
    it('ベーシックケース - id検索', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const all = [d1, d11, f111, d12, d2]
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll(all)
      })

      const actual = stores.storage.getList({ ids: [d11.id] })

      expect(actual).toEqual([d11])
      toBeCopy(actual)
    })

    it('ベーシックケース - path検索', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getList({ paths: [d11.path] })

      expect(actual).toEqual([d11])
      toBeCopy(actual)
    })

    it('ベーシックケース - idとpathを両方指定した場合', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getList({ ids: [d11.id], paths: [d12.path] })

      expect(actual).toEqual([d11, d12])
      toBeCopy(actual)
    })

    it('idとpath両方指定しなかった場合', () => {
      const { stores } = provideDependency()

      const actual = stores.storage.getList({})

      expect(actual).toEqual([])
    })
  })

  describe('getChildren', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getChildren(d1.path)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toEqual('d1/d11')
      expect(actual[1].path).toEqual('d1/d12')
      toBeCopy(actual)
    })
  })

  describe('getDirChildren', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getDirChildren('d1')

      expect(actual.length).toBe(3)
      expect(actual[0].path).toEqual('d1')
      expect(actual[1].path).toEqual('d1/d11')
      expect(actual[2].path).toEqual('d1/d12')
      toBeCopy(actual)
    })

    it('dirPathを指定しない場合', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getDirChildren()

      expect(actual.length).toBe(2)
      expect(actual[0].path).toEqual('d1')
      expect(actual[1].path).toEqual('d2')
      toBeCopy(actual)
    })
  })

  describe('getDescendants', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getDescendants(d1.path)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toEqual('d1/d11')
      expect(actual[1].path).toEqual('d1/d11/f111.txt')
      expect(actual[2].path).toEqual('d1/d12')
      toBeCopy(actual)
    })
  })

  describe('getDirDescendants', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getDirDescendants(d1.path)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toEqual('d1')
      expect(actual[1].path).toEqual('d1/d11')
      expect(actual[2].path).toEqual('d1/d11/f111.txt')
      expect(actual[3].path).toEqual('d1/d12')
      toBeCopy(actual)
    })

    it('dirPathを指定しない場合', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getDirDescendants()

      expect(actual.length).toBe(5)
      expect(actual[0].path).toEqual('d1')
      expect(actual[1].path).toEqual('d1/d11')
      expect(actual[2].path).toEqual('d1/d11/f111.txt')
      expect(actual[3].path).toEqual('d1/d12')
      expect(actual[4].path).toEqual('d2')
      toBeCopy(actual)
    })
  })

  describe('getHierarchical', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getHierarchical(f111.path)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toEqual('d1')
      expect(actual[1].path).toEqual('d1/d11')
      expect(actual[2].path).toEqual('d1/d11/f111.txt')
      toBeCopy(actual)
    })
  })

  describe('getAncestors', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.getAncestors(f111.path)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toEqual('d1')
      expect(actual[1].path).toEqual('d1/d11')
      toBeCopy(actual)
    })
  })

  describe('setAll', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const f1 = newStorageFileNode('f1.txt')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      stores.storage.setAll([d2, f1])

      expect(stores.storage.all.value.length).toBe(2)
      expect(stores.storage.get({ path: d2.path })).toEqual(d2)
      expect(stores.storage.get({ path: f1.path })).toEqual(f1)

      verifyStateNodes()
    })
  })

  describe('setList', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const UPDATED_AT = dayjs('2019-01-01')
      const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['ichiro'],
      }
      const actual = stores.storage.setList([
        cloneStorageNode(d11, { share: NEW_SHARE_SETTINGS, createdAt: UPDATED_AT, updatedAt: UPDATED_AT }),
        cloneStorageNode(f111, { share: NEW_SHARE_SETTINGS, createdAt: UPDATED_AT, updatedAt: UPDATED_AT }),
      ])

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(2)
      expect(actual[0].id).toBe(d11.id)
      expect(actual[0].share).toEqual(NEW_SHARE_SETTINGS)
      expect(actual[0].createdAt).toEqual(UPDATED_AT)
      expect(actual[0].updatedAt).toEqual(UPDATED_AT)
      expect(actual[1].id).toBe(f111.id)
      expect(actual[1].share).toEqual(NEW_SHARE_SETTINGS)
      expect(actual[1].createdAt).toEqual(UPDATED_AT)
      expect(actual[1].updatedAt).toEqual(UPDATED_AT)

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })
  })

  describe('set', () => {
    it('ベーシックケース - 一般ノード', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const UPDATED_AT = dayjs('2019-01-01')
      const NEW_SHARE_SETTINGS: StorageNodeShareSettings = {
        isPublic: true,
        readUIds: ['ichiro'],
        writeUIds: ['ichiro'],
      }
      const actual = stores.storage.set(
        cloneStorageNode(f111, {
          name: 'new_f111.txt',
          dir: 'd1',
          path: 'd1/new_f111.txt',
          contentType: 'application/octet-stream',
          size: 99,
          share: NEW_SHARE_SETTINGS,
          createdAt: UPDATED_AT,
          updatedAt: UPDATED_AT,
        })
      )

      expect(actual.id).toBe(f111.id)
      expect(actual.nodeType).toBe('File')
      expect(actual.name).toBe('new_f111.txt')
      expect(actual.dir).toBe('d1')
      expect(actual.path).toBe('d1/new_f111.txt')
      expect(actual.contentType).toBe('application/octet-stream')
      expect(actual.size).toEqual(99)
      expect(actual.share).toEqual(NEW_SHARE_SETTINGS)
      expect(actual.createdAt).toEqual(UPDATED_AT)
      expect(actual.updatedAt).toEqual(UPDATED_AT)
      // ---> コピーが設定されていることを検証
      expect(actual.share).not.toBe(NEW_SHARE_SETTINGS)
      expect(actual.share.readUIds).not.toBe(NEW_SHARE_SETTINGS.readUIds)
      expect(actual.share.writeUIds).not.toBe(NEW_SHARE_SETTINGS.writeUIds)
      // <---

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('ベーシックケース - 記事系ノード', () => {
      const config = useConfig()
      const usersPath = `${config.storage.user.rootName}`
      const userRootPath = `${usersPath}/${GeneralUser().uid}`
      const articleRootPath = `${userRootPath}/${config.storage.article.rootName}`
      const bundle = newStorageDirNode(`${articleRootPath}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'Bundle',
            type: 'ListBundle',
            sortOrder: 1,
          },
        },
      })
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([bundle])
      })

      const actual = stores.storage.set(
        cloneStorageNode(bundle, {
          article: {
            dir: {
              name: 'バンドル',
              type: 'TreeBundle',
              sortOrder: 2,
            },
          },
        })
      )

      expect(actual).toEqual({
        ...bundle,
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 2,
          },
        },
      })

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('プロパティの変更がない場合', () => {
      const d1 = newStorageDirNode('d1')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = stores.storage.set({
        id: d1.id,
        name: d1.name,
        dir: d1.dir,
        path: d1.path,
      })

      expect(actual.id).toBe(d1.id)
      expect(actual.nodeType).toBe(d1.nodeType)
      expect(actual.name).toBe(d1.name)
      expect(actual.dir).toBe(d1.dir)
      expect(actual.path).toBe(d1.path)
      expect(actual.url).toBe(d1.url)
      expect(actual.contentType).toBe(d1.contentType)
      expect(actual.share).toEqual(d1.share)
      expect(actual.createdAt).toEqual(d1.createdAt)
      expect(actual.updatedAt).toEqual(d1.updatedAt)

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('存在しないパスを指定した場合', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      let actual!: Error
      const notExistsId = StorageNode.generateId()
      try {
        stores.storage.set({ id: notExistsId, name: `dX`, dir: ``, path: `dX` })
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified node was not found: '${notExistsId}'`)
    })
  })

  describe('addList', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const f121 = newStorageFileNode('d1/d12/f121.txt')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.addList([d12, f121])

      StorageUtil.sortNodes(actual)
      expect(actual[0]).toEqual(d12)
      expect(actual[1]).toEqual(f121)

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })
  })

  describe('add', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const f121 = newStorageFileNode('d1/d12/f121.txt')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.add(f121)

      expect(actual).toEqual(f121)

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })
  })

  describe('removeList', () => {
    describe('pathバージョン', () => {
      it('ベーシックケース', () => {
        const d1 = newStorageDirNode('d1')
        const d11 = newStorageDirNode('d1/d11')
        const f111 = newStorageFileNode('d1/d11/f111.txt')
        const d12 = newStorageDirNode('d1/d12')
        const d2 = newStorageDirNode('d2')
        const { stores } = provideDependency(({ stores }) => {
          stores.storage.setAll([d1, d11, f111, d12, d2])
        })

        const actual = stores.storage.removeList({ paths: [d11.path, d12.path] })

        expect(actual.length).toBe(3)
        expect(actual[0].path).toBe('d1/d11')
        expect(actual[1].path).toBe('d1/d11/f111.txt')
        expect(actual[2].path).toBe('d1/d12')
        notExistsStateNodes(actual)
      })

      it(`'d1/d11'と親である'd1'をで同時に指定した場合`, () => {
        const d1 = newStorageDirNode('d1')
        const d11 = newStorageDirNode('d1/d11')
        const f111 = newStorageFileNode('d1/d11/f111.txt')
        const d12 = newStorageDirNode('d1/d12')
        const d2 = newStorageDirNode('d2')
        const { stores } = provideDependency(({ stores }) => {
          stores.storage.setAll([d1, d11, f111, d12, d2])
        })

        const actual = stores.storage.removeList({ paths: [d11.path, d1.path] })

        StorageUtil.sortNodes(actual)
        expect(actual.length).toBe(4)
        expect(actual[0].path).toBe('d1')
        expect(actual[1].path).toBe('d1/d11')
        expect(actual[2].path).toBe('d1/d11/f111.txt')
        expect(actual[3].path).toBe('d1/d12')
        notExistsStateNodes(actual)
      })

      it('存在しないパスを含んでいた場合', () => {
        const d1 = newStorageDirNode('d1')
        const d11 = newStorageDirNode('d1/d11')
        const f111 = newStorageFileNode('d1/d11/f111.txt')
        const d12 = newStorageDirNode('d1/d12')
        const d2 = newStorageDirNode('d2')
        const { stores } = provideDependency(({ stores }) => {
          stores.storage.setAll([d1, d11, f111, d12, d2])
        })

        const actual = stores.storage.removeList({ paths: [d11.path, 'dX', d12.path] })

        expect(actual.length).toBe(3)
        expect(actual[0].path).toBe('d1/d11')
        expect(actual[1].path).toBe('d1/d11/f111.txt')
        expect(actual[2].path).toBe('d1/d12')
        notExistsStateNodes(actual)
      })
    })

    describe('idバージョン', () => {
      it('ベーシックケース - idバージョン', () => {
        const d1 = newStorageDirNode('d1')
        const d11 = newStorageDirNode('d1/d11')
        const f111 = newStorageFileNode('d1/d11/f111.txt')
        const d12 = newStorageDirNode('d1/d12')
        const d2 = newStorageDirNode('d2')
        const { stores } = provideDependency(({ stores }) => {
          stores.storage.setAll([d1, d11, f111, d12, d2])
        })

        const actual = stores.storage.removeList({ ids: [d11.id, d12.id] })

        expect(actual.length).toBe(3)
        expect(actual[0].path).toBe('d1/d11')
        expect(actual[1].path).toBe('d1/d11/f111.txt')
        expect(actual[2].path).toBe('d1/d12')

        verifyStateNodes()
        notExistsStateNodes(actual)
      })

      it(`'d1/d11'と親である'd1'を同時に指定した場合 - idバージョン`, () => {
        const d1 = newStorageDirNode('d1')
        const d11 = newStorageDirNode('d1/d11')
        const f111 = newStorageFileNode('d1/d11/f111.txt')
        const d12 = newStorageDirNode('d1/d12')
        const d2 = newStorageDirNode('d2')
        const { stores } = provideDependency(({ stores }) => {
          stores.storage.setAll([d1, d11, f111, d12, d2])
        })

        const actual = stores.storage.removeList({ ids: [d11.id, d1.id] })

        StorageUtil.sortNodes(actual)
        expect(actual.length).toBe(4)
        expect(actual[0].path).toBe('d1')
        expect(actual[1].path).toBe('d1/d11')
        expect(actual[2].path).toBe('d1/d11/f111.txt')
        expect(actual[3].path).toBe('d1/d12')

        verifyStateNodes()
        notExistsStateNodes(actual)
      })

      it('存在しないIDを含んでいた場合', () => {
        const d1 = newStorageDirNode('d1')
        const d11 = newStorageDirNode('d1/d11')
        const f111 = newStorageFileNode('d1/d11/f111.txt')
        const d12 = newStorageDirNode('d1/d12')
        const d2 = newStorageDirNode('d2')
        const { stores } = provideDependency(({ stores }) => {
          stores.storage.setAll([d1, d11, f111, d12, d2])
        })

        const actual = stores.storage.removeList({ ids: [d11.id, 'xxx', d12.id] })

        expect(actual.length).toBe(3)
        expect(actual[0].path).toBe('d1/d11')
        expect(actual[1].path).toBe('d1/d11/f111.txt')
        expect(actual[2].path).toBe('d1/d12')

        verifyStateNodes()
        notExistsStateNodes(actual)
      })
    })

    it('idsとpaths両方指定しなかった場合', () => {
      const { stores } = provideDependency()

      let actual!: Error
      try {
        stores.storage.removeList({})
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`Either the 'ids' or the 'paths' must be specified.`)
    })
  })

  describe('remove', () => {
    it('ベーシックケース - pathバージョン', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.remove({ path: d11.path })

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/f111.txt')

      verifyStateNodes()
      notExistsStateNodes(actual)
    })

    it('ベーシックケース - idバージョン', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.remove({ id: d11.id })

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/f111.txt')

      verifyStateNodes()
      notExistsStateNodes(actual)
    })

    it(`ディレクトリ名があるディレクトリ名をベースにしている場合（'d1'と'd1_bk'のように）`, () => {
      // root
      // └d1
      //  ├d11 ← 削除
      //  │├d111
      //  ││└fileA.txt
      //  │└fileB.txt
      //  └d11_bk
      //     └fileC.txt
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const d111 = newStorageDirNode('d1/d11/d111')
      const fileA = newStorageDirNode('d1/d11/d111/fileA.txt')
      const fileB = newStorageDirNode('d1/d11/fileB.txt')
      const d11_bk = newStorageDirNode('d1/d11_bk')
      const fileC = newStorageDirNode('d1/d11_bk/fileC.txt')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, d111, fileA, fileB, d11_bk, fileC])
      })

      const actual = stores.storage.remove({ path: 'd1/d11' })

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe('d1/d11')
      expect(actual[1].path).toBe('d1/d11/d111')
      expect(actual[2].path).toBe('d1/d11/d111/fileA.txt')
      expect(actual[3].path).toBe('d1/d11/fileB.txt')

      verifyStateNodes()
      notExistsStateNodes(actual)
    })

    it('存在しないパスを指定した場合', () => {
      const d1 = newStorageDirNode('d1')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = stores.storage.remove({ path: 'dXXX' })

      expect(actual.length).toBe(0)
    })

    it('存在しないIDを指定した場合', () => {
      const d1 = newStorageDirNode('d1')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1])
      })

      const actual = stores.storage.remove({ id: 'xxx' })

      expect(actual.length).toBe(0)
    })
  })

  describe('move', () => {
    it('ディレクトリの移動 - ディレクトリへ移動', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.move('d1', 'd2/d1')

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe('d2/d1')
      expect(actual[1].path).toBe('d2/d1/d11')
      expect(actual[2].path).toBe('d2/d1/d11/f111.txt')
      expect(actual[3].path).toBe('d2/d1/d12')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('ディレクトリの移動 - ルートディレクトリへ移動', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.move('d1/d12', 'd12')

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe('d12')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('ファイルの移動 - ディレクトリへ移動', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.move('d1/d11/f111.txt', 'd1/d12/f111.txt')

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe('d1/d12/f111.txt')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('ファイルの移動 - ルートディレクトリへ移動', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.move('d1/d11/f111.txt', 'f111.txt')

      StorageUtil.sortNodes(actual)
      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe('f111.txt')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('移動先に同名のディレクトリまたはファイルが存在する場合', async () => {
      // root
      // ├dA
      // │└d1 ← 移動するノード
      // │  ├d11
      // │  │└d111
      // │  │  ├fileA.txt
      // │  │  └fileB.txt
      // │  ├d12
      // │  ├fileX.txt
      // │  └fileY.txt
      // └dB
      //   └d1 ← ここへ上書き移動
      //     ├d11
      //     │└d111
      //     │  ├fileA.txt
      //     │  └fileC.txt
      //     ├d13
      //     ├fileX.txt
      //     └fileZ.txt
      const dA = newStorageDirNode('dA')
      const dA_d1 = newStorageDirNode('dA/d1')
      const dA_d11 = newStorageDirNode('dA/d1/d11')
      const dA_d111 = newStorageDirNode('dA/d1/d11/d111')
      const dA_fileA = newStorageFileNode('dA/d1/d11/d111/fileA.txt')
      const dA_fileB = newStorageFileNode('dA/d1/d11/d111/fileB.txt')
      const dA_d12 = newStorageDirNode('dA/d1/d12')
      const dA_fileX = newStorageFileNode('dA/d1/fileX.txt')
      const dA_fileY = newStorageFileNode('dA/d1/fileY.txt')
      const dB = newStorageDirNode('dB')
      const dB_d1 = newStorageDirNode('dB/d1')
      const dB_d11 = newStorageDirNode('dB/d1/d11')
      const dB_d111 = newStorageDirNode('dB/d1/d11/d111')
      const dB_fileA = newStorageFileNode('dB/d1/d11/d111/fileA.txt')
      const dB_fileC = newStorageFileNode('dB/d1/d11/d111/fileC.txt')
      const dB_d13 = newStorageDirNode('dB/d1/d13')
      const dB_fileX = newStorageFileNode('dB/d1/fileX.txt')
      const dB_fileZ = newStorageFileNode('dB/d1/fileZ.txt')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([
          dA,
          dA_d1,
          dA_d11,
          dA_d111,
          dA_fileA,
          dA_fileB,
          dA_d12,
          dA_fileX,
          dA_fileY,
          dB,
          dB_d1,
          dB_d11,
          dB_d111,
          dB_fileA,
          dB_fileC,
          dB_d13,
          dB_fileX,
          dB_fileZ,
        ])
      })

      // 'dA/d1'を'dB'へ移動
      const actual = stores.storage.move('dA/d1', 'dB/d1')

      // root
      // ├dA
      // └dB
      //   └d1
      //     ├d11
      //     │└d111
      //     │  ├fileA.txt
      //     │  ├fileB.txt
      //     │  └fileC.txt
      //     ├d12
      //     ├d13
      //     ├fileX.txt
      //     ├fileY.txt
      //     └fileZ.txt

      // 戻り値の検証
      StorageUtil.sortNodes(actual)
      expect(actual.map(node => node.path)).toEqual([
        'dB/d1',
        'dB/d1/d11',
        'dB/d1/d11/d111',
        'dB/d1/d11/d111/fileA.txt',
        'dB/d1/d11/d111/fileB.txt',
        'dB/d1/d12',
        'dB/d1/fileX.txt',
        'dB/d1/fileY.txt',
      ])

      // 全ノードを取得し、移動後に想定したノードリストとなっているか検証
      stores.storage.sort()
      const [_dA, _dB, _d1, _d11, _d111, _fileA, _fileB, _fileC, _d12, _d13, _fileX, _fileY, _fileZ] = stores.storage.all.value
      expect(stores.storage.all.value.length).toBe(13)
      expect(_dA.path).toBe('dA')
      expect(_dB.path).toBe('dB')
      expect(_d1.path).toBe('dB/d1')
      expect(_d11.path).toBe('dB/d1/d11')
      expect(_d111.path).toBe('dB/d1/d11/d111')
      expect(_fileA.path).toBe('dB/d1/d11/d111/fileA.txt')
      expect(_fileB.path).toBe('dB/d1/d11/d111/fileB.txt')
      expect(_fileC.path).toBe('dB/d1/d11/d111/fileC.txt')
      expect(_d12.path).toBe('dB/d1/d12')
      expect(_d13.path).toBe('dB/d1/d13')
      expect(_fileX.path).toBe('dB/d1/fileX.txt')
      expect(_fileY.path).toBe('dB/d1/fileY.txt')
      expect(_fileZ.path).toBe('dB/d1/fileZ.txt')

      // 移動したノードの検証
      // ※移動されたのか、上書きされたのか、もとからあったのか
      expect(_d1.updatedAt).toEqual(dA_d1.updatedAt) // ← 上書き
      expect(_d11.updatedAt).toEqual(dA_d11.updatedAt) // ← 上書き
      expect(_d111.updatedAt).toEqual(dA_d111.updatedAt) // ← 上書き
      expect(_fileA.updatedAt).toEqual(dA_fileA.updatedAt) // ← 上書き
      expect(_fileB.updatedAt).toEqual(dA_fileB.updatedAt) // ← 移動
      expect(_fileC.updatedAt).toEqual(dB_fileC.updatedAt) // ← もとから
      expect(_d12.updatedAt).toEqual(dA_d12.updatedAt) // ← 移動
      expect(_d13.updatedAt).toEqual(dB_d13.updatedAt) // ← もとから
      expect(_fileX.updatedAt).toEqual(dA_fileX.updatedAt) // ← 上書き
      expect(_fileY.updatedAt).toEqual(dA_fileY.updatedAt) // ← 移動
      expect(_fileZ.updatedAt).toEqual(dB_fileZ.updatedAt) // ← もとから

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('存在しないパスを指定した場合', () => {
      const d1 = newStorageDirNode('d1')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d2])
      })

      let actual!: Error
      try {
        stores.storage.move('dXXX', 'd2/dXXX')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified node was not found: 'dXXX'`)
    })

    it('移動先ディレクトリが移動元のサブディレクトリの場合', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      let actual!: Error
      try {
        stores.storage.move('d1', 'd1/d11/d1')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The destination directory is its own subdirectory: 'd1' -> 'd1/d11/d1'`)
    })
  })

  describe('rename', () => {
    it('ディレクトリのリネーム - ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const actual = stores.storage.rename('d1', 'x1')

      stores.storage.sort()
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe('x1')
      expect(actual[1].path).toBe('x1/d11')
      expect(actual[2].path).toBe('x1/d11/f111.txt')
      expect(actual[3].path).toBe('x1/d12')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('ディレクトリのリネーム - 既存のディレクトリ名に文字を付け加える形でリネームをした場合', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      // 'd1'を'd1XXX'へリネーム
      const actual = stores.storage.rename('d1', 'd1XXX')

      stores.storage.sort()
      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe('d1XXX')
      expect(actual[1].path).toBe('d1XXX/d11')
      expect(actual[2].path).toBe('d1XXX/d11/f111.txt')
      expect(actual[3].path).toBe('d1XXX/d12')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('ファイルのリネーム', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111])
      })

      const actual = stores.storage.rename('d1/d11/f111.txt', 'fileX.txt')

      stores.storage.sort()
      expect(actual.length).toBe(1)
      expect(actual[0].path).toBe('d1/d11/fileX.txt')

      verifyStateNodes()
      existsStateNodes(actual)
      toBeCopy(actual)
    })

    it('存在しないパスを指定した場合', () => {
      const d1 = newStorageDirNode('d1')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d2])
      })

      let actual!: Error
      try {
        stores.storage.rename('dXXX', 'x1')
      } catch (err) {
        actual = err
      }

      expect(actual.message).toBe(`The specified node was not found: 'dXXX'`)
    })
  })

  describe('clear', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const d2 = newStorageDirNode('d2')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([d1, d11, f111, d12, d2])
      })

      const beforeAll = stores.storage.all.value

      stores.storage.removeAll()

      expect(stores.storage.all.value.length).toBe(0)
      notExistsStateNodes(beforeAll)
    })
  })

  describe('sort', () => {
    it('ベーシックケース', () => {
      const d1 = newStorageDirNode('d1')
      const d11 = newStorageDirNode('d1/d11')
      const f111 = newStorageFileNode('d1/d11/f111.txt')
      const d12 = newStorageDirNode('d1/d12')
      const f121 = newStorageFileNode('d1/d12/f121.txt')
      const d2 = newStorageDirNode('d2')
      const d21 = newStorageDirNode('d2/d21')
      const f1 = newStorageFileNode('f1.txt')
      const { stores } = provideDependency(({ stores }) => {
        stores.storage.setAll([f111, f121, f1, d1, d2, d11, d12, d21])
      })

      stores.storage.sort()

      expect(stores.storage.state.all[0]).toEqual(d1)
      expect(stores.storage.state.all[1]).toEqual(d11)
      expect(stores.storage.state.all[2]).toEqual(f111)
      expect(stores.storage.state.all[3]).toEqual(d12)
      expect(stores.storage.state.all[4]).toEqual(f121)
      expect(stores.storage.state.all[5]).toEqual(d2)
      expect(stores.storage.state.all[6]).toEqual(d21)
      expect(stores.storage.state.all[7]).toEqual(f1)
    })
  })

  describe('clone', () => {
    it('ベーシックケース', () => {
      const config = useConfig()
      const bundle = newStorageDirNode(`${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'バンドル',
            type: 'TreeBundle',
            sortOrder: 1,
          },
        },
        share: {
          isPublic: true,
          readUIds: ['ichiro'],
          writeUIds: ['ichiro'],
        },
      })
      const cat1 = newStorageDirNode(`${bundle.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: 'カテゴリ1',
            type: 'Category',
            sortOrder: 1,
          },
        },
      })
      const art1 = newStorageDirNode(`${cat1.path}/${StorageNode.generateId()}`, {
        article: {
          dir: {
            name: '記事1',
            type: 'Article',
            sortOrder: 1,
          },
        },
      })
      const art1_master = newStorageFileNode(`${art1.path}/${config.storage.article.srcMasterFileName}`, {
        article: { file: { type: 'Master' } },
      })
      const art1_draft = newStorageFileNode(`${art1.path}/${config.storage.article.srcDraftFileName}`, {
        article: { file: { type: 'Draft' } },
      })

      expect(bundle).toEqual(StorageNode.clone(bundle))
      expect(cat1).toEqual(StorageNode.clone(cat1))
      expect(art1).toEqual(StorageNode.clone(art1))
      expect(art1_master).toEqual(StorageNode.clone(art1_master))
      expect(art1_draft).toEqual(StorageNode.clone(art1_draft))
    })
  })
})
