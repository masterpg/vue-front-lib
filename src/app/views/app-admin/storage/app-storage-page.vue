<script lang="ts">
import { StoragePage, StoragePageTemplate } from '@/app/views/base/storage'
import { StorageType } from '@/app/logic'
import { defineComponent } from '@vue/composition-api'

namespace AppStoragePage {
  export const clazz = defineComponent({
    name: 'AppStoragePage',

    components: { ...StoragePage.components },

    mixins: [StoragePageTemplate],

    setup(props, ctx) {
      const storageType: StorageType = 'app'
      const base = StoragePage.setup({ ctx, storageType })
      return { ...base }
    },
  })
}

export default AppStoragePage.clazz
</script>
