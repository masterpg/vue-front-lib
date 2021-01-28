import {
  APIStorageNode,
  AuthDataResult,
  CreateArticleTypeDirInput,
  CreateStorageNodeInput,
  SetOwnUserInfoResult,
  SignedUploadUrlInput,
  StorageArticleDirType,
  StorageNodeGetKeyInput,
  StorageNodeGetKeysInput,
  StorageNodeKeyInput,
  StorageNodeShareSettingsInput,
  StoragePaginationInput,
  StoragePaginationResult,
  User,
  UserInput,
} from '@/app/service/base'
import { RawEntity, ToEntity, toEntity } from '@/app/service/api/base'
import { GQLAPIClient } from '@/app/service/api/gql/client'
import gql from 'graphql-tag'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface GQLAPIContainer {
  //--------------------------------------------------
  //  User
  //--------------------------------------------------

  getAuthData(): Promise<AuthDataResult>

  setOwnUserInfo(input: UserInput): Promise<SetOwnUserInfoResult>

  deleteOwnUser(): Promise<boolean>

  //--------------------------------------------------
  //  Storage
  //--------------------------------------------------

  getStorageNode(input: StorageNodeGetKeyInput): Promise<APIStorageNode | undefined>

  getStorageNodes(input: StorageNodeGetKeysInput): Promise<APIStorageNode[]>

  getStorageDirDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageDescendants(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageDirChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageChildren(dirPath?: string, input?: StoragePaginationInput): Promise<StoragePaginationResult>

  getStorageHierarchicalNodes(nodePath: string): Promise<APIStorageNode[]>

  getStorageAncestorDirs(nodePath: string): Promise<APIStorageNode[]>

  createStorageDir(dirPath: string, input?: CreateStorageNodeInput): Promise<APIStorageNode>

  createStorageHierarchicalDirs(dirPaths: string[]): Promise<APIStorageNode[]>

  removeStorageDir(dirPath: string): Promise<void>

  removeStorageFile(filePath: string): Promise<APIStorageNode | undefined>

  moveStorageDir(fromDirPath: string, toDirPath: string): Promise<void>

  moveStorageFile(fromFilePath: string, toFilePath: string): Promise<APIStorageNode>

  renameStorageDir(dirPath: string, newName: string): Promise<void>

  renameStorageFile(filePath: string, newName: string): Promise<APIStorageNode>

  setStorageDirShareSettings(dirPath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  setStorageFileShareSettings(filePath: string, input: StorageNodeShareSettingsInput): Promise<APIStorageNode>

  handleUploadedFile(input: StorageNodeKeyInput): Promise<APIStorageNode>

  getSignedUploadUrls(inputs: SignedUploadUrlInput[]): Promise<string[]>

  //--------------------------------------------------
  //  Article
  //--------------------------------------------------

  createArticleTypeDir(input: CreateArticleTypeDirInput): Promise<APIStorageNode>

  createArticleGeneralDir(dirPath: string): Promise<APIStorageNode>

  renameArticleDir(dirPath: string, newName: string): Promise<APIStorageNode>

  setArticleSortOrder(orderNodePaths: string[]): Promise<void>

  saveArticleSrcMasterFile(
    articleDirPath: string,
    srcContent: string,
    textContent: string
  ): Promise<{ master: APIStorageNode; draft: APIStorageNode }>

  saveArticleSrcDraftFile(articleDirPath: string, srcContent: string): Promise<APIStorageNode>

  getArticleChildren(dirPath: string, types: StorageArticleDirType[], input?: StoragePaginationInput): Promise<StoragePaginationResult>

  //--------------------------------------------------
  //  Helpers
  //--------------------------------------------------

  /**
   * ページングが必要なノード検索APIをページングがなくなるまで実行し結果を取得します。
   * 注意: ノード検索API関数の第一引数は検索オプション`StoragePaginationInput`
   *       であることを前提とします。
   *
   * @param func ノード検索API関数を指定
   * @param params ノード検索APIに渡す引数を指定
   */
  callStoragePaginationAPI<FUNC extends (...args: any[]) => Promise<StoragePaginationResult>>(
    func: FUNC,
    ...params: Parameters<FUNC>
  ): Promise<APIStorageNode[]>
}

//--------------------------------------------------
//  Storage
//--------------------------------------------------

interface RawStorageNode extends RawEntity<APIStorageNode> {}

interface RawStoragePaginationResult {
  list: RawStorageNode[]
  nextPageToken?: string
  isPaginationTimeout: boolean
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace GQLAPIContainer {
  export function newInstance(): GQLAPIContainer {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const clientLv1 = GQLAPIClient.newInstance('lv1')
    const clientLv3 = GQLAPIClient.newInstance('lv3')

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    //--------------------------------------------------
    //  User
    //--------------------------------------------------

    const getAuthData: GQLAPIContainer['getAuthData'] = async () => {
      const response = await clientLv1.query<{ authData: Omit<AuthDataResult, 'user'> & { user: RawEntity<User> } }>({
        query: gql`
          query GetAuthData {
            authData {
              status
              token
              user {
                id
                email
                emailVerified
                userName
                fullName
                isAppAdmin
                photoURL
                version
                createdAt
                updatedAt
              }
            }
          }
        `,
        isAuth: true,
      })

      const { status, token, user } = response.data.authData
      if (!user) {
        return { status, token, user: undefined }
      }

      return { status, token, user: toEntity(user) }
    }

    const setOwnUserInfo: GQLAPIContainer['setOwnUserInfo'] = async input => {
      const response = await clientLv1.mutate<
        { setOwnUserInfo: Omit<SetOwnUserInfoResult, 'user'> & { user: RawEntity<User> } },
        { input: UserInput }
      >({
        mutation: gql`
          mutation SetOwnUserInfo($input: UserInput!) {
            setOwnUserInfo(input: $input) {
              status
              user {
                id
                email
                emailVerified
                userName
                fullName
                isAppAdmin
                photoURL
                version
                createdAt
                updatedAt
              }
            }
          }
        `,
        variables: { input: UserInput.squeeze(input) },
        isAuth: true,
      })

      const result = response.data!.setOwnUserInfo
      return {
        status: result.status,
        user: toEntity(result.user),
      }
    }

    const deleteOwnUser: GQLAPIContainer['deleteOwnUser'] = async () => {
      const response = await clientLv1.mutate<{ deleteOwnUser: boolean }>({
        mutation: gql`
          mutation DeleteOwnUser {
            deleteOwnUser
          }
        `,
        isAuth: true,
      })
      return response.data!.deleteOwnUser
    }

    //--------------------------------------------------
    //  Storage
    //--------------------------------------------------

    const StorageNodeFieldsName = 'StorageNodeFields'

    const StorageNodeFields = gql`
      fragment ${StorageNodeFieldsName} on StorageNode {
        id
        nodeType
        name
        dir
        path
        contentType
        size
        share {
          isPublic
          readUIds
          writeUIds
        }
        article {
          dir {
            name
            type
            sortOrder
          }
          file {
            type
          }
        }
        version
        createdAt
        updatedAt
      }
    `

    function toStorageNode<T extends RawStorageNode | undefined | null>(rawEntity: T): ToEntity<T> {
      if (!rawEntity) return undefined as ToEntity<T>

      if (rawEntity.article) {
        rawEntity.article.dir = rawEntity.article.dir ?? undefined
        rawEntity.article.file = rawEntity.article.file ?? undefined
      } else {
        rawEntity.article = undefined
      }
      return toEntity(rawEntity)
    }

    function toStorageNodes<T extends RawStorageNode>(rawEntities: T[]): ToEntity<T>[] {
      return rawEntities.map(rawEntity => toStorageNode(rawEntity))
    }

    const getStorageNode: GQLAPIContainer['getStorageNode'] = async input => {
      const response = await clientLv1.query<{ storageNode: RawStorageNode | null }, { input: StorageNodeGetKeyInput }>({
        query: gql`
          query GetStorageNode($input: StorageNodeGetKeyInput!) {
            storageNode(input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          input: StorageNodeGetKeyInput.squeeze(input),
        },
        isAuth: true,
      })
      return toStorageNode(response.data.storageNode)
    }

    const getStorageNodes: GQLAPIContainer['getStorageNodes'] = async input => {
      const response = await clientLv1.query<{ storageNodes: RawStorageNode[] }, { input: StorageNodeGetKeysInput }>({
        query: gql`
          query GetStorageNodes($input: StorageNodeGetKeysInput!) {
            storageNodes(input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          input: StorageNodeGetKeysInput.squeeze(input),
        },
        isAuth: true,
      })
      return toStorageNodes(response.data.storageNodes)
    }

    const getStorageDirDescendants: GQLAPIContainer['getStorageDirDescendants'] = async (dirPath, input) => {
      const response = await clientLv1.query<
        { storageDirDescendants: RawStoragePaginationResult },
        { dirPath?: string; input?: StoragePaginationInput }
      >({
        query: gql`
          query GetStorageDirDescendants($dirPath: String, $input: StoragePaginationInput) {
            storageDirDescendants(dirPath: $dirPath, input: $input) {
              list {
                ...${StorageNodeFieldsName}
              }
              nextPageToken
              isPaginationTimeout
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          input: StoragePaginationInput.squeeze(input),
        },
        isAuth: true,
      })
      return {
        list: toStorageNodes(response.data.storageDirDescendants.list),
        nextPageToken: response.data.storageDirDescendants.nextPageToken || undefined,
        isPaginationTimeout: response.data.storageDirDescendants.isPaginationTimeout ?? false,
      }
    }

    const getStorageDescendants: GQLAPIContainer['getStorageDescendants'] = async (dirPath, input) => {
      const response = await clientLv1.query<
        { storageDescendants: RawStoragePaginationResult },
        { dirPath?: string; input?: StoragePaginationInput }
      >({
        query: gql`
          query GetStorageDescendants($dirPath: String, $input: StoragePaginationInput) {
            storageDescendants(dirPath: $dirPath, input: $input) {
              list {
                ...${StorageNodeFieldsName}
              }
              nextPageToken
              isPaginationTimeout
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          input: StoragePaginationInput.squeeze(input),
        },
        isAuth: true,
      })
      return {
        list: toStorageNodes(response.data.storageDescendants.list),
        nextPageToken: response.data.storageDescendants.nextPageToken || undefined,
        isPaginationTimeout: response.data.storageDescendants.isPaginationTimeout ?? false,
      }
    }

    const getStorageDirChildren: GQLAPIContainer['getStorageDirChildren'] = async (dirPath, input) => {
      const response = await clientLv1.query<
        { storageDirChildren: RawStoragePaginationResult },
        { dirPath?: string; input?: StoragePaginationInput }
      >({
        query: gql`
          query GetStorageDirChildren($dirPath: String, $input: StoragePaginationInput) {
            storageDirChildren(dirPath: $dirPath, input: $input) {
              list {
                ...${StorageNodeFieldsName}
              }
              nextPageToken
              isPaginationTimeout
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          input: StoragePaginationInput.squeeze(input),
        },
        isAuth: true,
      })
      return {
        list: toStorageNodes(response.data.storageDirChildren.list),
        nextPageToken: response.data.storageDirChildren.nextPageToken || undefined,
        isPaginationTimeout: response.data.storageDirChildren.isPaginationTimeout ?? false,
      }
    }

    const getStorageChildren: GQLAPIContainer['getStorageChildren'] = async (dirPath, input) => {
      const response = await clientLv1.query<{ storageChildren: RawStoragePaginationResult }, { dirPath?: string; input?: StoragePaginationInput }>({
        query: gql`
          query GetStorageChildren($dirPath: String, $input: StoragePaginationInput) {
            storageChildren(dirPath: $dirPath, input: $input) {
              list {
                ...${StorageNodeFieldsName}
              }
              nextPageToken
              isPaginationTimeout
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          input: StoragePaginationInput.squeeze(input),
        },
        isAuth: true,
      })
      return {
        list: toStorageNodes(response.data.storageChildren.list),
        nextPageToken: response.data.storageChildren.nextPageToken || undefined,
        isPaginationTimeout: response.data.storageChildren.isPaginationTimeout ?? false,
      }
    }

    const getStorageHierarchicalNodes: GQLAPIContainer['getStorageHierarchicalNodes'] = async nodePath => {
      const response = await clientLv1.query<{ storageHierarchicalNodes: RawStorageNode[] }, { nodePath: string }>({
        query: gql`
          query GetStorageHierarchicalNodes($nodePath: String!) {
            storageHierarchicalNodes(nodePath: $nodePath) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { nodePath },
        isAuth: true,
      })
      return toStorageNodes(response.data!.storageHierarchicalNodes)
    }

    const getStorageAncestorDirs: GQLAPIContainer['getStorageAncestorDirs'] = async nodePath => {
      const response = await clientLv1.query<{ storageAncestorDirs: RawStorageNode[] }, { nodePath: string }>({
        query: gql`
          query GetStorageAncestorDirs($nodePath: String!) {
            storageAncestorDirs(nodePath: $nodePath) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { nodePath },
        isAuth: true,
      })
      return toStorageNodes(response.data!.storageAncestorDirs)
    }

    const createStorageDir: GQLAPIContainer['createStorageDir'] = async (dirPath, input) => {
      const response = await clientLv1.mutate<{ createStorageDir: RawStorageNode }, { dirPath: string; input?: CreateStorageNodeInput }>({
        mutation: gql`
          mutation CreateStorageDir($dirPath: String!, $input: CreateStorageNodeInput) {
            createStorageDir(dirPath: $dirPath, input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          input: CreateStorageNodeInput.squeeze(input),
        },
        isAuth: true,
      })
      return toStorageNode(response.data!.createStorageDir)
    }

    const createStorageHierarchicalDirs: GQLAPIContainer['createStorageHierarchicalDirs'] = async dirPaths => {
      const response = await clientLv1.mutate<{ createStorageHierarchicalDirs: RawStorageNode[] }, { dirPaths: string[] }>({
        mutation: gql`
          mutation CreateStorageHierarchicalDirs($dirPaths: [String!]!) {
            createStorageHierarchicalDirs(dirPaths: $dirPaths) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { dirPaths },
        isAuth: true,
      })
      return toStorageNodes(response.data!.createStorageHierarchicalDirs)
    }

    const removeStorageDir: GQLAPIContainer['removeStorageDir'] = async dirPath => {
      const response = await clientLv3.mutate<{ removeStorageDir: boolean }, { dirPath: string }>({
        mutation: gql`
          mutation RemoveStorageDir($dirPath: String!) {
            removeStorageDir(dirPath: $dirPath)
          }
        `,
        variables: { dirPath },
        isAuth: true,
      })
    }

    const removeStorageFile: GQLAPIContainer['removeStorageFile'] = async filePath => {
      const response = await clientLv1.mutate<{ removeStorageFile: RawStorageNode | null }, { filePath: string }>({
        mutation: gql`
          mutation RemoveStorageFile($filePath: String!) {
            removeStorageFile(filePath: $filePath) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { filePath },
        isAuth: true,
      })
      return toStorageNode(response.data!.removeStorageFile)
    }

    const moveStorageDir: GQLAPIContainer['moveStorageDir'] = async (fromDirPath, toDirPath) => {
      const response = await clientLv3.mutate<{ moveStorageDir: RawStoragePaginationResult }, { fromDirPath: string; toDirPath: string }>({
        mutation: gql`
          mutation MoveStorageDir($fromDirPath: String!, $toDirPath: String!) {
            moveStorageDir(fromDirPath: $fromDirPath, toDirPath: $toDirPath)
          }
        `,
        variables: { fromDirPath, toDirPath },
        isAuth: true,
      })
    }

    const moveStorageFile: GQLAPIContainer['moveStorageFile'] = async (fromFilePath, toFilePath) => {
      const response = await clientLv1.mutate<{ moveStorageFile: RawStorageNode }, { fromFilePath: string; toFilePath: string }>({
        mutation: gql`
          mutation MoveStorageFile($fromFilePath: String!, $toFilePath: String!) {
            moveStorageFile(fromFilePath: $fromFilePath, toFilePath: $toFilePath) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { fromFilePath, toFilePath },
        isAuth: true,
      })
      return toStorageNode(response.data!.moveStorageFile)
    }

    const renameStorageDir: GQLAPIContainer['renameStorageDir'] = async (dirPath, newName) => {
      const response = await clientLv3.mutate<{ renameStorageDir: boolean }, { dirPath: string; newName: string }>({
        mutation: gql`
          mutation RenameStorageDir($dirPath: String!, $newName: String!) {
            renameStorageDir(dirPath: $dirPath, newName: $newName)
          }
        `,
        variables: { dirPath, newName },
        isAuth: true,
      })
    }

    const renameStorageFile: GQLAPIContainer['renameStorageFile'] = async (filePath, newName) => {
      const response = await clientLv1.mutate<{ renameStorageFile: RawStorageNode }, { filePath: string; newName: string }>({
        mutation: gql`
          mutation RenameStorageFile($filePath: String!, $newName: String!) {
            renameStorageFile(filePath: $filePath, newName: $newName) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { filePath, newName },
        isAuth: true,
      })
      return toStorageNode(response.data!.renameStorageFile)
    }

    const setStorageDirShareSettings: GQLAPIContainer['setStorageDirShareSettings'] = async (dirPath, input) => {
      const response = await clientLv1.mutate<
        { setStorageDirShareSettings: RawStorageNode },
        { dirPath: string; input: StorageNodeShareSettingsInput }
      >({
        mutation: gql`
          mutation SetStorageDirShareSettings($dirPath: String!, $input: StorageNodeShareSettingsInput!) {
            setStorageDirShareSettings(dirPath: $dirPath, input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          input: StorageNodeShareSettingsInput.squeeze(input),
        },
        isAuth: true,
      })
      return toStorageNode(response.data!.setStorageDirShareSettings)
    }

    const handleUploadedFile: GQLAPIContainer['handleUploadedFile'] = async input => {
      const response = await clientLv1.mutate<{ handleUploadedFile: RawStorageNode }, { input: StorageNodeKeyInput }>({
        mutation: gql`
          mutation HandleUploadedFile($input: StorageNodeKeyInput!) {
            handleUploadedFile(input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          input: StorageNodeKeyInput.squeeze(input),
        },
        isAuth: true,
      })
      return toStorageNode(response.data!.handleUploadedFile)
    }

    const setStorageFileShareSettings: GQLAPIContainer['setStorageFileShareSettings'] = async (filePath, input) => {
      const response = await clientLv1.mutate<
        { setStorageFileShareSettings: RawStorageNode },
        { filePath: string; input: StorageNodeShareSettingsInput }
      >({
        mutation: gql`
          mutation SetStorageFileShareSettings($filePath: String!, $input: StorageNodeShareSettingsInput!) {
            setStorageFileShareSettings(filePath: $filePath, input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          filePath,
          input: StorageNodeShareSettingsInput.squeeze(input),
        },
        isAuth: true,
      })
      return toStorageNode(response.data!.setStorageFileShareSettings)
    }

    const getSignedUploadUrls: GQLAPIContainer['getSignedUploadUrls'] = async inputs => {
      const response = await clientLv1.query<{ signedUploadUrls: string[] }, { inputs: SignedUploadUrlInput[] }>({
        query: gql`
          query GetSignedUploadUrls($inputs: [SignedUploadUrlInput!]!) {
            signedUploadUrls(inputs: $inputs)
          }
        `,
        variables: {
          inputs: inputs.map(input => SignedUploadUrlInput.squeeze(input)),
        },
        isAuth: true,
      })
      return response.data.signedUploadUrls
    }

    //--------------------------------------------------
    //  Article
    //--------------------------------------------------

    const createArticleTypeDir: GQLAPIContainer['createArticleTypeDir'] = async input => {
      const response = await clientLv1.mutate<{ createArticleTypeDir: RawStorageNode }, { input: CreateArticleTypeDirInput }>({
        mutation: gql`
          mutation CreateArticleTypeDir($input: CreateArticleTypeDirInput!) {
            createArticleTypeDir(input: $input) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { input: CreateArticleTypeDirInput.squeeze(input) },
        isAuth: true,
      })
      return toStorageNode(response.data!.createArticleTypeDir)
    }

    const createArticleGeneralDir: GQLAPIContainer['createArticleGeneralDir'] = async dirPath => {
      const response = await clientLv1.mutate<{ createArticleGeneralDir: RawStorageNode }, { dirPath: string }>({
        mutation: gql`
          mutation CreateArticleGeneralDir($dirPath: String!) {
            createArticleGeneralDir(dirPath: $dirPath) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { dirPath },
        isAuth: true,
      })
      return toStorageNode(response.data!.createArticleGeneralDir)
    }

    const renameArticleDir: GQLAPIContainer['renameArticleDir'] = async (dirPath, newName) => {
      const response = await clientLv1.mutate<{ renameArticleDir: RawStorageNode }, { dirPath: string; newName: string }>({
        mutation: gql`
          mutation RenameArticleNode($dirPath: String!, $newName: String!) {
            renameArticleDir(dirPath: $dirPath, newName: $newName) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { dirPath, newName },
        isAuth: true,
      })
      return toStorageNode(response.data!.renameArticleDir)
    }

    const setArticleSortOrder: GQLAPIContainer['setArticleSortOrder'] = async orderNodePaths => {
      await clientLv1.mutate<{ setArticleSortOrder: boolean }, { orderNodePaths: string[] }>({
        mutation: gql`
          mutation SetArticleSortOrder($orderNodePaths: [String!]!) {
            setArticleSortOrder(orderNodePaths: $orderNodePaths)
          }
        `,
        variables: { orderNodePaths },
        isAuth: true,
      })
    }

    const saveArticleSrcMasterFile: GQLAPIContainer['saveArticleSrcMasterFile'] = async (articleDirPath, srcContent, textContent) => {
      const response = await clientLv1.mutate<
        { saveArticleSrcMasterFile: { master: RawStorageNode; draft: RawStorageNode } },
        { articleDirPath: string; srcContent: string; textContent: string }
      >({
        mutation: gql`
          mutation SaveArticleSrcMasterFile($articleDirPath: String!, $srcContent: String!, $textContent: String!) {
            saveArticleSrcMasterFile(articleDirPath: $articleDirPath, srcContent: $srcContent, textContent: $textContent) {
              master {
                ...${StorageNodeFieldsName}
              }
              draft {
                ...${StorageNodeFieldsName}
              }
            }
          }
          ${StorageNodeFields}
        `,
        variables: { articleDirPath, srcContent, textContent },
        isAuth: true,
      })
      return {
        master: toStorageNode(response.data!.saveArticleSrcMasterFile.master),
        draft: toStorageNode(response.data!.saveArticleSrcMasterFile.draft),
      }
    }

    const saveArticleSrcDraftFile: GQLAPIContainer['saveArticleSrcDraftFile'] = async (articleDirPath, srcContent) => {
      const response = await clientLv1.mutate<{ saveArticleSrcDraftFile: RawStorageNode }, { articleDirPath: string; srcContent: string }>({
        mutation: gql`
          mutation SaveArticleSrcDraftFile($articleDirPath: String!, $srcContent: String!) {
            saveArticleSrcDraftFile(articleDirPath: $articleDirPath, srcContent: $srcContent) {
              ...${StorageNodeFieldsName}
            }
          }
          ${StorageNodeFields}
        `,
        variables: { articleDirPath, srcContent },
        isAuth: true,
      })
      return toStorageNode(response.data!.saveArticleSrcDraftFile)
    }

    const getArticleChildren: GQLAPIContainer['getArticleChildren'] = async (dirPath, types, input) => {
      const response = await clientLv1.query<
        { articleChildren: RawStoragePaginationResult },
        { dirPath: string; types: StorageArticleDirType[]; input: StoragePaginationInput }
      >({
        query: gql`
          query GetArticleChildren($dirPath: String!, $types: [StorageArticleDirType!]!, $input: StoragePaginationInput) {
            articleChildren(dirPath: $dirPath, types: $types, input: $input) {
              list {
                ...${StorageNodeFieldsName}
              }
              nextPageToken
              isPaginationTimeout
            }
          }
          ${StorageNodeFields}
        `,
        variables: {
          dirPath,
          types,
          input: StoragePaginationInput.squeeze(input),
        },
        isAuth: true,
      })
      return {
        list: toStorageNodes(response.data.articleChildren.list),
        nextPageToken: response.data.articleChildren.nextPageToken || undefined,
        isPaginationTimeout: response.data.articleChildren.isPaginationTimeout ?? false,
      }
    }

    //--------------------------------------------------
    //  Helpers
    //--------------------------------------------------

    const callStoragePaginationAPI: GQLAPIContainer['callStoragePaginationAPI'] = async (func, ...params) => {
      const result: APIStorageNode[] = []

      // ノード検索APIの検索オプションを取得
      // ※ノード検索APIの引数の最後は検索オプションという前提
      let input: StoragePaginationInput
      const lastParam = params[params.length - 1]
      if (typeof lastParam.maxChunk === 'number' || typeof lastParam.pageToken === 'string') {
        input = lastParam
        params[params.length - 1] = input
      } else {
        input = {
          maxChunk: undefined,
          pageToken: undefined,
        }
        params.push(input)
      }

      // ノード検索APIの実行
      // ※ページングがなくなるまで実行
      let nodeData = await func(...params)
      result.push(...nodeData.list)
      while (nodeData.nextPageToken) {
        input.pageToken = nodeData.nextPageToken
        nodeData = await func(...params)
        result.push(...nodeData.list)
      }

      return result
    }

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      getAuthData,
      setOwnUserInfo,
      deleteOwnUser,
      getStorageNode,
      getStorageNodes,
      getStorageDirDescendants,
      getStorageDescendants,
      getStorageDirChildren,
      getStorageChildren,
      getStorageHierarchicalNodes,
      getStorageAncestorDirs,
      createStorageDir,
      createStorageHierarchicalDirs,
      removeStorageDir,
      removeStorageFile,
      moveStorageDir,
      moveStorageFile,
      renameStorageDir,
      renameStorageFile,
      setStorageDirShareSettings,
      handleUploadedFile,
      setStorageFileShareSettings,
      getSignedUploadUrls,
      createArticleTypeDir,
      createArticleGeneralDir,
      renameArticleDir,
      setArticleSortOrder,
      saveArticleSrcMasterFile,
      saveArticleSrcDraftFile,
      getArticleChildren,
      callStoragePaginationAPI,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { GQLAPIContainer, RawStorageNode }
