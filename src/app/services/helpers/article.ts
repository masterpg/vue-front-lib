import { Unsubscribe, createNanoEvents } from 'nanoevents'

//========================================================================
//
//  Interfaces
//
//========================================================================

interface ArticleHelper {
  emitTableOfContentsUpdate(): void
  watchTableOfContentsUpdate: (cb: () => any) => Unsubscribe
}

//========================================================================
//
//  Implementation
//
//========================================================================

namespace ArticleHelper {
  export function newInstance(): ArticleHelper {
    const emitter = createNanoEvents()

    const emitTableOfContentsUpdate: ArticleHelper['emitTableOfContentsUpdate'] = () => {
      emitter.emit('tableOfContentsUpdate')
    }

    const watchTableOfContentsUpdate: ArticleHelper['watchTableOfContentsUpdate'] = cb => {
      return emitter.on('tableOfContentsUpdate', cb)
    }

    return {
      emitTableOfContentsUpdate,
      watchTableOfContentsUpdate,
    }
  }
}

//========================================================================
//
//  Exports
//
//========================================================================

export { ArticleHelper }
