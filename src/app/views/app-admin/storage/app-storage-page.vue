<script lang="ts">
import { StoragePage, StoragePageTemplate } from '@/app/views/base/storage'
import { StorageDirPathBreadcrumb } from '@/app/views/base/storage/storage-dir-path-breadcrumb.vue'
import { StorageDirView } from '@/app/views/base/storage/storage-dir-view.vue'
import { StorageNodeRemoveDialog } from '@/app/views/base/storage/storage-node-remove-dialog.vue'
import { StorageType } from '@/app/logic'
import { StorageUploadProgressFloat } from '@/app/components/storage/storage-upload-progress-float.vue'
import { TreeView } from '@/app/components/tree-view/tree-view.vue'
import { defineComponent } from '@vue/composition-api'

interface Props {}

namespace AppStoragePage {
  export const clazz = defineComponent({
    name: 'AppStoragePage',

    components: {
      TreeView: TreeView.clazz,
      StorageDirPathBreadcrumb: StorageDirPathBreadcrumb.clazz,
      StorageDirView: StorageDirView.clazz,
      StorageUploadProgressFloat: StorageUploadProgressFloat.clazz,
      StorageNodeRemoveDialog: StorageNodeRemoveDialog.clazz,
    },

    mixins: [StoragePageTemplate],

    setup(props: Props, ctx) {
      //----------------------------------------------------------------------
      //
      //  Variables
      //
      //----------------------------------------------------------------------

      const storageType: StorageType = 'app'

      const base = StoragePage.setup({ props, ctx, storageType })

      //----------------------------------------------------------------------
      //
      //  Result
      //
      //----------------------------------------------------------------------

      return {
        ...base,
      }
    },
  })
}

export default AppStoragePage.clazz
</script>
