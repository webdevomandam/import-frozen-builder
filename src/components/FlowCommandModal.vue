<script setup>
  import { NModal, NFormItem, NSelect, NInput, NFlex, NButton, useNotification } from 'naive-ui';
  import { useGlobalState } from '../store';
  import { ref, computed } from 'vue';

  const { flowCommandModal, flowCommands, flowCommandTypes } = useGlobalState();
  const parentCommands = computed(() => {
    return flowCommands.value.map(flowCommand => ({ label: `(${flowCommand.id}) ${flowCommand.flowCommandTypeName}`, value: flowCommand.id }));
  });
</script>

<template>
  <NModal
    class="w-[600px]"
    v-model:show="flowCommandModal.show"
    title="Flow Command"
    :mask-closable="false"
    preset="card"
  >
    <NFormItem
      label="Parent Command"
    >
      <NSelect
        :options="parentCommands"
        placeholder="Select Payment Type"
        filterable
      />
    </NFormItem>

    <NFormItem label="Command Type">
      <NSelect
        :options="flowCommandTypes"
        placeholder="Select Payment Type"
        filterable
      />
    </NFormItem>

    <NFormItem class="mt-5" label="Payload">
      <NInput type="textarea"/>
    </NFormItem>

    <NFormItem class="mt-5" label="Order">
      <NInput type="number"/>
    </NFormItem>

    <template #footer>
      <NFlex justify="end">
        <NButton ghost type="primary">Proceed</NButton>
        <NButton>Close</NButton>
      </NFlex>
    </template>
  </NModal>
</template>