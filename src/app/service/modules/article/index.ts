import { ArticleTableOfContentsNode } from '@/app/service'
import { extendedMethod } from '@/app/base'
import { injectAPI } from '@/app/service/api'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleService {
  /**
   * 指定されたユーザーの記事の目次を取得します。
   * @param userName
   */
  fetchTableOfContents(userName: string): Promise<ArticleTableOfContentsNode[]>
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ArticleService {
  export function newInstance(): ArticleService {
    return newRawInstance()
  }

  export function newRawInstance() {
    //----------------------------------------------------------------------
    //
    //  Variables
    //
    //----------------------------------------------------------------------

    const api = injectAPI()

    //----------------------------------------------------------------------
    //
    //  Methods
    //
    //----------------------------------------------------------------------

    const fetchTableOfContents: ArticleService['fetchTableOfContents'] = async userName => {
      return fetchArticleTableOfContentsAPI(userName)
    }

    //----------------------------------------------------------------------
    //
    //  Internal methods
    //
    //----------------------------------------------------------------------

    //--------------------------------------------------
    //  API
    //--------------------------------------------------

    const fetchArticleTableOfContentsAPI = extendedMethod(async (userName: string) => {
      return await api.getArticleTableOfContents(userName)
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      fetchTableOfContents,
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { ArticleService }
