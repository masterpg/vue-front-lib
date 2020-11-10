<script lang="ts">
import { StoragePage, StoragePageTemplate } from '@/app/views/base/storage'
import { StorageType } from '@/app/logic'
import { defineComponent } from '@vue/composition-api'

namespace UserStoragePage {
  export const clazz = defineComponent({
    name: 'UserStoragePage',

    components: { ...StoragePage.components },

    mixins: [StoragePageTemplate],

    setup(props, ctx) {
      const storageType: StorageType = 'user'
      const base = StoragePage.setup({ ctx, storageType })
      return { ...base }
    },
  })
}

export default UserStoragePage.clazz
</script>
