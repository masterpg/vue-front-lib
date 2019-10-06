import * as admin from 'firebase-admin'
import * as path from 'path'
import { SignedUploadUrlInput, StorageNode, StorageNodeType, StorageServiceDI, TestServiceDI } from '../../../../../src/services/business'
import { FirestoreServiceDI } from '../../../../../src/services/base'
import { InputValidationError } from '../../../../../src/base/validator'
import { Test } from '@nestjs/testing'
import { config } from '../../../../../src/base/config'
import { initFirebaseApp } from '../../../../../src/base/firebase'
import { removeBothEndsSlash } from '../../../../../src/base/utils'

jest.setTimeout(25000)
initFirebaseApp()

const GENERAL_USER = { uid: 'taro.yamada' }
const TEST_FILES_DIR = 'test-files'

async function existsNodes(nodes: StorageNode[], basePath: string = ''): Promise<void> {
  const bucket = admin.storage().bucket()
  for (const node of nodes) {
    let nodePath = basePath ? `${removeBothEndsSlash(basePath)}/${node.path}` : node.path
    nodePath += node.nodeType === StorageNodeType.Dir ? '/' : ''
    let gcsNode = bucket.file(nodePath)
    const exists = (await gcsNode.exists())[0]
    expect(exists).toBeTruthy()
  }
}

async function notExistsNodes(nodes: StorageNode[], basePath: string = ''): Promise<void> {
  const bucket = admin.storage().bucket()
  for (const node of nodes) {
    let nodePath = basePath ? `${removeBothEndsSlash(basePath)}/${node.path}` : node.path
    nodePath += node.nodeType === StorageNodeType.Dir ? '/' : ''
    let gcsNode = bucket.file(nodePath)
    const exists = (await gcsNode.exists())[0]
    expect(exists).toBeFalsy()
  }
}

describe('StorageService', () => {
  let storageService: StorageServiceDI.type
  let testService: TestServiceDI.type

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [TestServiceDI.provider, FirestoreServiceDI.provider, StorageServiceDI.provider],
    }).compile()

    storageService = module.get<StorageServiceDI.type>(StorageServiceDI.symbol)
    testService = module.get<TestServiceDI.type>(TestServiceDI.symbol)

    await storageService.removeStorageDirNodes(`${TEST_FILES_DIR}`)
    await storageService.removeStorageDirNodes(`${storageService.getUserStorageDirPath(GENERAL_USER)}/`)
  })

  describe('uploadLocalFiles', () => {
    it('単一ファイルをアップロード', async () => {
      const localFilePath = `${__dirname}/${TEST_FILES_DIR}/fileX.txt`
      const toFilePath = `${TEST_FILES_DIR}/fileX.txt`

      const actual = await storageService.uploadLocalFiles([{ localFilePath, toFilePath }])

      expect(actual[0]).toEqual({
        nodeType: StorageNodeType.File,
        name: 'fileX.txt',
        dir: TEST_FILES_DIR,
        path: `${TEST_FILES_DIR}/fileX.txt`,
      })

      const toDirNodes = await storageService.getStorageDirNodes(`${TEST_FILES_DIR}`)
      expect(toDirNodes.length).toBe(2)
      expect(toDirNodes[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(toDirNodes[1].path).toBe(`${TEST_FILES_DIR}/fileX.txt`)
    })

    it('単一ファイルをアップロード - toFilePathの先頭に"/"を付与', async () => {
      const localFilePath = `${__dirname}/${TEST_FILES_DIR}/fileX.txt`
      const toFilePath = `/${TEST_FILES_DIR}/fileX.txt` // ← 先頭に"/"を付与

      const actual = await storageService.uploadLocalFiles([{ localFilePath, toFilePath }])

      expect(actual[0]).toEqual({
        nodeType: StorageNodeType.File,
        name: 'fileX.txt',
        dir: TEST_FILES_DIR,
        path: `${TEST_FILES_DIR}/fileX.txt`,
      })

      const toDirNodes = await storageService.getStorageDirNodes(`${TEST_FILES_DIR}`)
      expect(toDirNodes.length).toBe(2)
      expect(toDirNodes[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(toDirNodes[1].path).toBe(`${TEST_FILES_DIR}/fileX.txt`)
    })

    it('複数ファイルをアップロード', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${TEST_FILES_DIR}/fileB.txt`,
        },
      ]

      const actual = await storageService.uploadLocalFiles(uploadList)

      for (let i = 0; i < actual.length; i++) {
        expect(actual[i]).toEqual({
          nodeType: StorageNodeType.File,
          name: path.basename(uploadList[i].toFilePath),
          dir: path.dirname(uploadList[i].toFilePath),
          path: uploadList[i].toFilePath,
        })
      }

      const toDirNodes = await storageService.getStorageDirNodes(`${TEST_FILES_DIR}`)
      expect(toDirNodes.length).toBe(3)
      expect(toDirNodes[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(toDirNodes[1].path).toBe(uploadList[0].toFilePath)
      expect(toDirNodes[2].path).toBe(uploadList[1].toFilePath)
    })

    it('存在しないローカルファイルを指定した場合', async () => {
      const fileName = 'fileXXX.txt'
      const localFilePath = path.join(__dirname, TEST_FILES_DIR, fileName)
      const toFilePath = path.join(TEST_FILES_DIR, fileName)

      let actual!: any
      try {
        await storageService.uploadLocalFiles([{ localFilePath, toFilePath }])
      } catch (err) {
        actual = err
      }

      expect(actual.code).toBe('ENOENT')
    })
  })

  describe('getStorageDirNodes', () => {
    it('ディレクトリを作成した場合', async () => {
      // ディレクトリを作成
      await storageService.createStorageDirs([`${TEST_FILES_DIR}/dir1/dir1_1`, `${TEST_FILES_DIR}/dir1/dir1_2`])

      // 作成したディレクトリにファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileC.txt`,
          toFilePath: `${TEST_FILES_DIR}/fileC.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/dir1_1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/dir1_2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageDirNodes(`${TEST_FILES_DIR}`)

      expect(actual.length).toBe(7)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_1`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_1/fileA.txt`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_2`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_2/fileB.txt`)
      expect(actual[6].path).toBe(`${TEST_FILES_DIR}/fileC.txt`)
    })

    it('ディレクトリを作成しなかった', async () => {
      // ディレクトリを作成せずファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileC.txt`,
          toFilePath: `${TEST_FILES_DIR}/fileC.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/dir1_1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/dir1_2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageDirNodes(`${TEST_FILES_DIR}`)

      expect(actual.length).toBe(7)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_1`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_1/fileA.txt`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_2`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_2/fileB.txt`)
      expect(actual[6].path).toBe(`${TEST_FILES_DIR}/fileC.txt`)
    })

    it('basePathを指定した場合', async () => {
      // ディレクトリを作成
      await storageService.createStorageDirs([`${TEST_FILES_DIR}`, `${TEST_FILES_DIR}/dir1/dir1_1`])

      // 作成したディレクトリにファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/dir1_1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileC.txt`,
          toFilePath: `${TEST_FILES_DIR}/fileC.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageDirNodes(`dir1/dir1_1`, `${TEST_FILES_DIR}`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_1/fileA.txt`)
    })

    it('basePathを指定した場合 - dirPathが空の場合', async () => {
      // ディレクトリを作成
      await storageService.createStorageDirs([`${TEST_FILES_DIR}/dir1/dir1_1`])

      // 作成したディレクトリにファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/dir1_1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileC.txt`,
          toFilePath: `${TEST_FILES_DIR}/fileC.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageDirNodes('', `${TEST_FILES_DIR}`)

      expect(actual.length).toBe(4)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_1/fileA.txt`)
      expect(actual[3].path).toBe(`fileC.txt`)
    })

    it('dirPath、basePathの先頭・末尾に"/"を付与', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileZ.txt`,
          toFilePath: `/${TEST_FILES_DIR}/dir1/dir1_1/fileZ.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      // パスの先頭・末尾に"/"を付与
      const actual = await storageService.getStorageDirNodes('/dir1/', `/${TEST_FILES_DIR}/`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_1/fileZ.txt`)
    })
  })

  describe('getUserStorageDirNodes', () => {
    it('ディレクトリを指定しない場合', async () => {
      const userDirPath = storageService.getUserStorageDirPath(GENERAL_USER)
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${userDirPath}/dir1/dir1_1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${userDirPath}/dir1/dir1_2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getUserStorageDirNodes(GENERAL_USER)

      expect(actual.length).toBe(5)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_1/fileA.txt`)
      expect(actual[3].path).toBe(`dir1/dir1_2`)
      expect(actual[4].path).toBe(`dir1/dir1_2/fileB.txt`)
    })

    it('ディレクトリを指定した場合', async () => {
      const userDirPath = storageService.getUserStorageDirPath(GENERAL_USER)
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${userDirPath}/dir1/dir1_1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${userDirPath}/dir1/dir1_2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getUserStorageDirNodes(GENERAL_USER, `dir1/dir1_1`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_1/fileA.txt`)
    })
  })

  describe('createStorageDirs', () => {
    it('ベーシックケース', async () => {
      const actual = await storageService.createStorageDirs([
        `${TEST_FILES_DIR}/dir3`,
        `${TEST_FILES_DIR}/dir1/dir1_1`,
        `${TEST_FILES_DIR}/dir1/dir1_2`,
        `${TEST_FILES_DIR}/dir2/dir2_1`,
      ])

      expect(actual.length).toBe(7)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_1`)
      expect(actual[3].path).toBe(`${TEST_FILES_DIR}/dir1/dir1_2`)
      expect(actual[4].path).toBe(`${TEST_FILES_DIR}/dir2`)
      expect(actual[5].path).toBe(`${TEST_FILES_DIR}/dir2/dir2_1`)
      expect(actual[6].path).toBe(`${TEST_FILES_DIR}/dir3`)
      await existsNodes(actual)
    })

    it('basePathを指定した場合', async () => {
      const actual = await storageService.createStorageDirs([`dir3`, `dir1/dir1_1`, `dir1/dir1_2`, `dir2/dir2_1`], `${TEST_FILES_DIR}`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_2`)
      expect(actual[3].path).toBe(`dir2`)
      expect(actual[4].path).toBe(`dir2/dir2_1`)
      expect(actual[5].path).toBe(`dir3`)
      await existsNodes(actual, `${TEST_FILES_DIR}`)
    })

    it('dirPaths、basePathの先頭・末尾に"/"を付与', async () => {
      // パスの先頭・末尾に"/"を付与
      const actual = await storageService.createStorageDirs([`/dir3/`, `/dir1/dir1_1/`, `/dir1/dir1_2/`, `/dir2/dir2_1/`], `/${TEST_FILES_DIR}/`)

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_2`)
      expect(actual[3].path).toBe(`dir2`)
      expect(actual[4].path).toBe(`dir2/dir2_1`)
      expect(actual[5].path).toBe(`dir3`)
      await existsNodes(actual, `/${TEST_FILES_DIR}/`)
    })
  })

  describe('createUserStorageDirs', () => {
    it('ベーシックケース', async () => {
      const actual = await storageService.createUserStorageDirs(GENERAL_USER, [`dir3`, `dir1/dir1_1`, `dir1/dir1_2`, `dir2/dir2_1`])

      expect(actual.length).toBe(6)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/dir1_1`)
      expect(actual[2].path).toBe(`dir1/dir1_2`)
      expect(actual[3].path).toBe(`dir2`)
      expect(actual[4].path).toBe(`dir2/dir2_1`)
      expect(actual[5].path).toBe(`dir3`)
      const userDirPath = storageService.getUserStorageDirPath(GENERAL_USER)
      await existsNodes(actual, userDirPath)
    })
  })

  describe('removeStorageFileNodes', () => {
    it('ベーシックケース', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeStorageFileNodes([`${TEST_FILES_DIR}/dir1/fileA.txt`, `${TEST_FILES_DIR}/dir2/fileB.txt`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir1/fileA.txt`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir2/fileB.txt`)
      await notExistsNodes(actual)
    })

    it('filePathsの先頭に"/"を付与', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      // パスの先頭に"/"を付与
      const actual = await storageService.removeStorageFileNodes([`/${TEST_FILES_DIR}/dir1/fileA.txt`, `/${TEST_FILES_DIR}/dir2/fileB.txt`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir1/fileA.txt`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir2/fileB.txt`)
      await notExistsNodes(actual)
    })

    it('basePathを指定した場合', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir2/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeStorageFileNodes([`dir1/fileA.txt`, `dir2/fileB.txt`], `${TEST_FILES_DIR}`)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`dir1/fileA.txt`)
      expect(actual[1].path).toBe(`dir2/fileB.txt`)
      await notExistsNodes(actual)
    })

    it('存在しないファイルを指定', async () => {
      const actual = await storageService.removeStorageFileNodes([`${TEST_FILES_DIR}/dir1/fileXXX.txt`])

      expect(actual.length).toBe(0)
    })
  })

  describe('removeUserStorageFileNodes', () => {
    it('ベーシックケース', async () => {
      const userDirPath = storageService.getUserStorageDirPath(GENERAL_USER)

      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${userDirPath}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${userDirPath}/dir2/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeUserStorageFileNodes(GENERAL_USER, [`dir1/fileX.txt`, `dir2/fileY.txt`])

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`dir1/fileX.txt`)
      expect(actual[1].path).toBe(`dir2/fileY.txt`)
      await notExistsNodes(actual)
    })
  })

  describe('removeStorageDirNodes', () => {
    it('ディレクトリを作成した場合', async () => {
      // ディレクトリを作成
      await storageService.createStorageDirs([`${TEST_FILES_DIR}/dir1`, `${TEST_FILES_DIR}/dir2`])

      // 作成したディレクトリにファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeStorageDirNodes(`${TEST_FILES_DIR}/dir1`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir1`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1/fileX.txt`)
      expect(actual[2].path).toBe(`${TEST_FILES_DIR}/dir1/fileY.txt`)
      await notExistsNodes(actual)
    })

    it('ディレクトリを作成しない場合', async () => {
      // ディレクトリを作成せずファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeStorageDirNodes(`${TEST_FILES_DIR}/dir1`)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir1/fileX.txt`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1/fileY.txt`)
      await notExistsNodes(actual)
    })

    it('dirPathの先頭に"/"を付与', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      // パスの先頭・末尾に"/"を付与
      const actual = await storageService.removeStorageDirNodes(`/${TEST_FILES_DIR}/dir1/`)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`${TEST_FILES_DIR}/dir1/fileX.txt`)
      expect(actual[1].path).toBe(`${TEST_FILES_DIR}/dir1/fileY.txt`)
      await notExistsNodes(actual)
    })

    it('basePathを指定した場合', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeStorageDirNodes(`dir1`, `${TEST_FILES_DIR}`)

      expect(actual.length).toBe(2)
      expect(actual[0].path).toBe(`dir1/fileX.txt`)
      expect(actual[1].path).toBe(`dir1/fileY.txt`)
      await notExistsNodes(actual)
    })
  })

  describe('removeUserStorageDirNodes', () => {
    it('ベーシックケース', async () => {
      const userDirPath = storageService.getUserStorageDirPath(GENERAL_USER)

      // ディレクトリを作成
      await storageService.createStorageDirs([`${userDirPath}/dir1`, `${userDirPath}/dir2`])

      // 作成したディレクトリにファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileA.txt`,
          toFilePath: `${userDirPath}/dir1/fileA.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileB.txt`,
          toFilePath: `${userDirPath}/dir1/fileB.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.removeUserStorageDirNodes(GENERAL_USER, `dir1`)

      expect(actual.length).toBe(3)
      expect(actual[0].path).toBe(`dir1`)
      expect(actual[1].path).toBe(`dir1/fileA.txt`)
      expect(actual[2].path).toBe(`dir1/fileB.txt`)
      await notExistsNodes(actual)
    })
  })

  describe('getSignedUploadUrls', () => {
    it('ベーシックケース', async () => {
      const requestOrigin = config.cors.whitelist[0]
      const inputs: SignedUploadUrlInput[] = [
        { filePath: `${TEST_FILES_DIR}/fileA.txt`, contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/fileB.txt`, contentType: 'text/plain' },
      ]

      const actual = await storageService.getSignedUploadUrls(requestOrigin, inputs)

      expect(actual.length).toBe(2)
    })

    it('リクエストオリジンが不正な場合', async () => {
      const requestOrigin = 'https://aaa.bbb.ccc.co.jp'
      const inputs: SignedUploadUrlInput[] = [
        { filePath: `${TEST_FILES_DIR}/fileA.txt`, contentType: 'text/plain' },
        { filePath: `${TEST_FILES_DIR}/fileB.txt`, contentType: 'text/plain' },
      ]

      let actual!: InputValidationError
      try {
        await storageService.getSignedUploadUrls(requestOrigin, inputs)
      } catch (err) {
        actual = err
      }

      expect(actual.detail.message).toBe('Request origin is invalid.')
    })
  })

  describe('getStorageNodeMap', () => {
    it('ディレクトリを作成した場合', async () => {
      // ディレクトリを作成
      await storageService.createStorageDirs([`${TEST_FILES_DIR}/dir1`])

      // 作成したディレクトリにファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageNodeMap(`${TEST_FILES_DIR}/dir1`)

      expect(Object.keys(actual).length).toBe(3)
      expect(actual[`${TEST_FILES_DIR}/dir1`]).toBeDefined()
      expect(actual[`${TEST_FILES_DIR}/dir1/fileX.txt`]).toBeDefined()
      expect(actual[`${TEST_FILES_DIR}/dir1/fileY.txt`]).toBeDefined()
    })

    it('ディレクトリを作成しなかった場合', async () => {
      // ディレクトリを作成せずファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageNodeMap(`${TEST_FILES_DIR}/dir1`)

      expect(Object.keys(actual).length).toBe(2)
      expect(actual[`${TEST_FILES_DIR}/dir1/fileX.txt`]).toBeDefined()
      expect(actual[`${TEST_FILES_DIR}/dir1/fileY.txt`]).toBeDefined()
    })

    it('dirPathを指定せず、basePathを指定した場合', async () => {
      // ディレクトリを作成せずファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageNodeMap(undefined, `${TEST_FILES_DIR}`)

      expect(Object.keys(actual).length).toBe(2)
      expect(actual[`dir1/fileX.txt`]).toBeDefined()
      expect(actual[`dir1/fileY.txt`]).toBeDefined()
    })

    it('dirPathの先頭に"/"を付与した場合', async () => {
      // ディレクトリを作成せずファイルをアップロード
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileX.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileX.txt`,
        },
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileY.txt`,
          toFilePath: `${TEST_FILES_DIR}/dir1/fileY.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      const actual = await storageService.getStorageNodeMap(`/${TEST_FILES_DIR}`)

      expect(Object.keys(actual).length).toBe(2)
      expect(actual[`${TEST_FILES_DIR}/dir1/fileX.txt`]).toBeDefined()
      expect(actual[`${TEST_FILES_DIR}/dir1/fileY.txt`]).toBeDefined()
    })
  })

  describe('toStorageNode', () => {
    it('ディレクトリノードの変換', async () => {
      await storageService.createStorageDirs([`${TEST_FILES_DIR}/docs`])
      const nodeMap = await storageService.getStorageNodeMap(`${TEST_FILES_DIR}/docs`)

      const actual = storageService.toStorageNode(nodeMap[`${TEST_FILES_DIR}/docs`].gcsNode!)

      expect(actual.nodeType).toBe(StorageNodeType.Dir)
      expect(actual.name).toBe(`docs`)
      expect(actual.dir).toBe(`${TEST_FILES_DIR}`)
      expect(actual.path).toBe(`${TEST_FILES_DIR}/docs`)
    })

    it('ファイルノードの変換', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileZ.txt`,
          toFilePath: `${TEST_FILES_DIR}/docs/fileZ.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)
      const nodeMap = await storageService.getStorageNodeMap(`${TEST_FILES_DIR}/docs`)

      const actualFileNode = storageService.toStorageNode(nodeMap[`${TEST_FILES_DIR}/docs/fileZ.txt`].gcsNode!)

      expect(actualFileNode.nodeType).toBe(StorageNodeType.File)
      expect(actualFileNode.name).toBe(`fileZ.txt`)
      expect(actualFileNode.dir).toBe(`${TEST_FILES_DIR}/docs`)
      expect(actualFileNode.path).toBe(`${TEST_FILES_DIR}/docs/fileZ.txt`)
    })

    it('basePathを指定した場合', async () => {
      const uploadList = [
        {
          localFilePath: `${__dirname}/${TEST_FILES_DIR}/fileZ.txt`,
          toFilePath: `${TEST_FILES_DIR}/docs/fileZ.txt`,
        },
      ]
      await storageService.uploadLocalFiles(uploadList)

      // gcsNodeを取得
      const nodeMap = await storageService.getStorageNodeMap(`${TEST_FILES_DIR}/docs`)

      const actual = storageService.toStorageNode(nodeMap[`${TEST_FILES_DIR}/docs/fileZ.txt`].gcsNode!, `${TEST_FILES_DIR}`)

      expect(actual.nodeType).toBe(StorageNodeType.File)
      expect(actual.name).toBe(`fileZ.txt`)
      expect(actual.dir).toBe(`docs`)
      expect(actual.path).toBe(`docs/fileZ.txt`)
    })
  })

  describe('toDirStorageNode', () => {
    it('ベーシックケース', async () => {
      await storageService.createStorageDirs([`${TEST_FILES_DIR}/docs`])
      const nodeMap = await storageService.getStorageNodeMap(`${TEST_FILES_DIR}/docs`)

      const actual = storageService.toDirStorageNode(`${TEST_FILES_DIR}/docs`)

      expect(actual.nodeType).toBe(StorageNodeType.Dir)
      expect(actual.name).toBe(`docs`)
      expect(actual.dir).toBe(`${TEST_FILES_DIR}`)
      expect(actual.path).toBe(`${TEST_FILES_DIR}/docs`)
    })
  })

  describe('sortStorageNodes', () => {
    it('昇順でソート', async () => {
      const dir1: StorageNode = { nodeType: StorageNodeType.Dir, name: 'dir1', dir: '', path: 'dir1' }
      const fileA: StorageNode = { nodeType: StorageNodeType.File, name: 'fileA.txt', dir: 'dir1', path: 'dir1/fileA.txt' }
      const dir2: StorageNode = { nodeType: StorageNodeType.Dir, name: 'dir2', dir: '', path: 'dir2' }
      const fileB: StorageNode = { nodeType: StorageNodeType.File, name: 'fileB.txt', dir: 'dir2', path: 'dir2/fileB.txt' }
      const fileC: StorageNode = { nodeType: StorageNodeType.File, name: 'fileC.txt', dir: '', path: 'fileC.txt' }
      const fileD: StorageNode = { nodeType: StorageNodeType.File, name: 'fileD.txt', dir: '', path: 'fileD.txt' }

      const nodes = [fileA, fileB, fileC, fileD, dir1, dir2]
      storageService.sortStorageNodes(nodes)

      expect(nodes[0]).toBe(dir1)
      expect(nodes[1]).toBe(fileA)
      expect(nodes[2]).toBe(dir2)
      expect(nodes[3]).toBe(fileB)
      expect(nodes[4]).toBe(fileC)
      expect(nodes[5]).toBe(fileD)
    })

    it('降順でソート', async () => {
      const dir1 = { nodeType: StorageNodeType.Dir, name: 'dir1', dir: '', path: 'dir1' }
      const fileA = { nodeType: StorageNodeType.File, name: 'fileA.txt', dir: 'dir1', path: 'dir1/fileA.txt' }
      const dir2 = { nodeType: StorageNodeType.Dir, name: 'dir2', dir: '', path: 'dir2' }
      const fileB = { nodeType: StorageNodeType.File, name: 'fileB.txt', dir: 'dir2', path: 'dir2/fileB.txt' }
      const fileC = { nodeType: StorageNodeType.File, name: 'fileC.txt', dir: '', path: 'fileC.txt' }
      const fileD = { nodeType: StorageNodeType.File, name: 'fileD.txt', dir: '', path: 'fileD.txt' }

      const nodes = [fileA, fileB, fileC, fileD, dir1, dir2]
      storageService.sortStorageNodes(nodes, true)

      expect(nodes[0]).toBe(fileD)
      expect(nodes[1]).toBe(fileC)
      expect(nodes[2]).toBe(dir2)
      expect(nodes[3]).toBe(fileB)
      expect(nodes[4]).toBe(dir1)
      expect(nodes[5]).toBe(fileA)
    })
  })

  describe('getUserStorageDirPath', () => {
    it('ベーシックケース', async () => {
      const actual = storageService.getUserStorageDirPath(GENERAL_USER)
      expect(actual).toBe(`users/${GENERAL_USER.uid}`)
    })
  })

  describe('padVirtualDirNode', () => {
    it('ベーシックケース', async () => {
      const fileA: StorageNode = {
        nodeType: StorageNodeType.File,
        name: 'fileA.txt',
        dir: 'dir1/dir1_1',
        path: 'dir1/dir1_1/fileA.txt',
      }
      const fileB: StorageNode = {
        nodeType: StorageNodeType.File,
        name: 'fileB.txt',
        dir: 'dir2/dir2_1',
        path: 'dir2/dir2_1/fileB.txt',
      }
      const fileC: StorageNode = {
        nodeType: StorageNodeType.File,
        name: 'fileC.txt',
        dir: 'dir2',
        path: 'dir2/fileC.txt',
      }
      const fileD: StorageNode = {
        nodeType: StorageNodeType.File,
        name: 'fileD.txt',
        dir: '',
        path: 'fileD.txt',
      }

      const actual = {
        [fileA.path]: fileA,
        [fileB.path]: fileB,
        [fileC.path]: fileC,
        [fileD.path]: fileD,
      }

      storageService.padVirtualDirNode(actual)

      expect(Object.keys(actual).length).toBe(8)
      expect(actual[`dir1`].path).toBe(`dir1`)
      expect(actual[`dir1/dir1_1`].path).toBe(`dir1/dir1_1`)
      expect(actual[`dir1/dir1_1/fileA.txt`].path).toBe(`dir1/dir1_1/fileA.txt`)
      expect(actual[`dir2`].path).toBe(`dir2`)
      expect(actual[`dir2/dir2_1`].path).toBe(`dir2/dir2_1`)
      expect(actual[`dir2/dir2_1/fileB.txt`].path).toBe(`dir2/dir2_1/fileB.txt`)
      expect(actual[`dir2/fileC.txt`].path).toBe(`dir2/fileC.txt`)
      expect(actual[`fileD.txt`].path).toBe(`fileD.txt`)
    })
  })

  describe('splitHierarchicalDirPaths', () => {
    it('ベーシックケース', async () => {
      const actual = storageService.splitHierarchicalDirPaths(`dir1`, `dir1/dir1_1/fileA.txt`, `dir1/dir1_1/fileB.txt`, 'dir2/dir2_1/fileC.txt')

      expect(actual.length).toBe(7)
      expect(actual[0]).toBe(`dir1`)
      expect(actual[1]).toBe(`dir1/dir1_1`)
      expect(actual[2]).toBe(`dir1/dir1_1/fileA.txt`)
      expect(actual[3]).toBe(`dir1/dir1_1/fileB.txt`)
      expect(actual[4]).toBe(`dir2`)
      expect(actual[5]).toBe(`dir2/dir2_1`)
      expect(actual[6]).toBe(`dir2/dir2_1/fileC.txt`)
    })
  })
})
