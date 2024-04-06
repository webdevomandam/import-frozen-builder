<script setup>
  import { defineProps } from 'vue';
  import { NButton, NIcon, NFlex } from 'naive-ui'
  import { Edit16Filled, Delete16Filled } from '@vicons/fluent';
  import { useGlobalState, ModalAction } from '../store';

  const { action, data } = defineProps({ action: Number, data: Object });

  const { actionModal } = useGlobalState();
  function showModal() {
    if (action === ModalAction.UpdateDataCommand) {
      actionModal.value = {
        show: true,
        action: ModalAction.UpdateDataCommand,
        data: {
          id         : data.id,
          commandType: data.data_command_type_id,
          field      : data.field,
          reload     : data.reload,
          payload    : data.payload,
          order      : data.order
        }
      };

      return;
    }

    return;
  }

</script>

<template>
  <NFlex size="small">
    <NButton @click="showModal" class="ml-1" text>
      <template #icon>
        <NIcon><Edit16Filled/></NIcon>
      </template>
    </NButton>
    <NButton text>
      <template #icon>
        <NIcon><Delete16Filled/></NIcon>
      </template>
    </NButton>
  </NFlex>
</template>