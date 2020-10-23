<style lang="sass" scoped>
@import 'src/app/styles/app.variables'
</style>

<template>
  <q-menu ref="menu" class="StorageNodePopupMenu" :touch-position="contextMenu" :context-menu="contextMenu" @before-show="m_menuOnBeforeShow">
    <q-list dense style="min-width: 100px;">
      <template v-for="(menuItem, index) in m_menuItems">
        <q-separator v-if="menuItem.type === 'separator'" :key="index" />
        <q-item v-else :key="index" v-close-popup clickable>
          <q-item-section @click="m_menuItemOnClick(menuItem)">{{ menuItem.label }}</q-item-section>
        </q-item>
      </template>
    </q-list>
  </q-menu>
</template>

<script lang="ts">
import { defineComponent } from '@vue/composition-api'

//========================================================================
//
//  Interfaces
//
//========================================================================

//========================================================================
//
//  Implementation
//
//========================================================================

namespace StorageNodePopupMenu {
  export const clazz = defineComponent({
    name: 'StorageNodePopupMenu',

    setup(props: {}, ctx) {},
  })
}

//========================================================================
//
//  Exports
//
//========================================================================

export default StorageNodePopupMenu.clazz
// eslint-disable-next-line no-undef
export { StorageNodePopupMenu }
</script>
