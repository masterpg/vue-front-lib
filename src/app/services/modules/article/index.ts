import { ArticleHelper, useInternalService } from '@/app/services/modules/internal'
import { ArticleTableOfContentsNode } from '@/app/services'
import { extendedMethod } from '@/app/base'
import { useAPI } from '@/app/services/apis'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleService extends Pick<ArticleHelper, 'emitTableOfContentsUpdate' | 'watchTableOfContentsUpdate'> {
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

    const apis = useAPI()
    const helpers = useInternalService()

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
      return await apis.getArticleTableOfContents(userName)
    })

    //----------------------------------------------------------------------
    //
    //  Result
    //
    //----------------------------------------------------------------------

    return {
      fetchTableOfContents,
      emitTableOfContentsUpdate: helpers.article.emitTableOfContentsUpdate,
      watchTableOfContentsUpdate: helpers.article.watchTableOfContentsUpdate,
    }
  }
}

//========================================================================
//
//  Export
//
//========================================================================

export { ArticleService }
