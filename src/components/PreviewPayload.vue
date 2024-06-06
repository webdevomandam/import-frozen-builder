<script setup>
  import { NPopover, NButton, NIcon, NFormItem, NInput } from 'naive-ui';
  import { Code16Filled } from '@vicons/fluent';

  const { payload } = defineProps({ payload: String });
  const beautifiedPayload = JSON.stringify(JSON.parse(payload), null, 2)
</script>

<template>
  <NPopover class="w-[400px]">
    <template #trigger>
      <NButton text type="primary">
        <template #icon>
          <NIcon><Code16Filled/></NIcon>
        </template>
      </NButton>
    </template>
    <NFormItem class="mt-5" label="Payload">
      <NInput type="textarea" rows="10" v-model:value="beautifiedPayload" readonly />
    </NFormItem>
  </NPopover>
</template>