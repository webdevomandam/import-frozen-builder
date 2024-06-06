<script setup>
  import { NButton, NIcon, NFlex, NPopconfirm, NTooltip, useNotification } from 'naive-ui'
  import { Edit16Filled, Delete16Filled, AddSquareMultiple16Filled, Copy16Filled } from '@vicons/fluent';
  import { useGlobalState, ModalAction, defaultActionModal } from '../store';
  import { useFetch } from '@vueuse/core';
  import { toRefs, watch } from 'vue';

  const props = defineProps({ isPayload: Boolean, command: String, removeAction: Number, updateAction: Number, data: Object });
  const { removeAction, updateAction, data, command, isPayload } = toRefs(props);
  const { actionModal, apiToken, apiURL, dataCommands, flowCommands, hasDraggedPayload, isLiveAPI } = useGlobalState();
  const notification = useNotification();

  function showModal() {
    if (updateAction.value === ModalAction.UpdateDataCommand) {
      actionModal.value = {
        show: true,
        action: ModalAction.UpdateDataCommand,
        type: 'dataCommand',
        data: {
          id         : data.value.id,
          commandType: data.value.data_command_type_id,
          field      : data.value.field,
          reload     : data.value.reload,
          payload    : data.value.payload,
          order      : ''+data.value.order
        }
      };

      return;
    }

    actionModal.value = {
      show: true,
      action: ModalAction.UpdateFlowCommand,
      type: 'flowCommand',
      data: {
        id           : data.value.id,
        parentCommand: data.value.parent_id,
        commandType  : data.value.flow_command_type_id,
        payload      : data.value.payload,
        order        : ''+data.value.order
      }
    };

    return;
  }

  function removeCommand() {
    if (removeAction.value === ModalAction.RemoveDataCommand) {
      removeDataCommand();
      return;
    }

    if (removeAction.value === ModalAction.RemoveFlowCommand) {
      removeFlowCommand();
      return;
    }

    return;
  }

  async function removeDataCommand() {
    const { statusCode } = await useFetch(`${apiURL.value}/frozen-import-data-commands/${data.value.id}`, { headers : { Authorization: apiToken.value, Gui: 'Case Management', 'Is-Live-Api': +isLiveAPI.value }})
      .delete();

    if (statusCode.value !== 204) {
      notification.error({ content: 'Something went wrong while removing Data Command!', duration: 2500 });
      return;
    }

    dataCommands.value = dataCommands.value.filter(dataCommand => dataCommand.id !== data.value.id);
  }

  async function removeFlowCommand() {
    const { statusCode } = await useFetch(`${apiURL.value}/frozen-import-flow-commands/${data.value.id}`, { headers: { Authorization: apiToken.value, Gui: 'Case Management', 'Is-Live-Api': +isLiveAPI.value }})
      .delete();

    if (statusCode.value !== 204) {
      notification.error({ content: 'Something went wrong while removing Flow Command!', duration: 2500 });
      return;
    }

    flowCommands.value = flowCommands.value.filter(flowCommand => flowCommand.id !== data.value.id);
  }

  function addChildCommand() {
    actionModal.value = {
      show: true,
      action: ModalAction.AddFlowCommand,
      type: 'flowCommand',
      data: {
        ...JSON.parse(defaultActionModal).data,
        parentCommand: data.value.id
      } 
    };

    return;
  }

  async function copyPayload() {
    await navigator.clipboard.writeText(data.value.payload);
    notification.info({ content: 'Copied to Clipboard', duration: 2500 })
  }

  watch(hasDraggedPayload, (value) => {
    if (!value) return;

    notification.error({ content: 'Cannot drag n drop payload!', duration: 2500 });
    hasDraggedPayload.value = false;
  });

</script>

<template>
  <div class="command-button-group">
    <NFlex size="small">
      <template v-if="!isPayload">
        <NTooltip v-if="command === 'flowCommand'">
          <template #trigger>
            <NButton v-on:click="addChildCommand" class="ml-1" text type="primary">
              <template #icon>
                <NIcon><AddSquareMultiple16Filled/></NIcon>
              </template>
            </NButton>
          </template>
          Add Child Command
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NButton v-on:click="showModal" text type="primary">
              <template #icon>
                <NIcon><Edit16Filled/></NIcon>
              </template>
            </NButton>
          </template>
          Update Command
        </NTooltip>

        <NTooltip>
          <template #trigger>
            <NPopconfirm v-on:positive-click="removeCommand">
              <template #trigger>
                <NButton text type="primary">
                  <template #icon>
                    <NIcon><Delete16Filled/></NIcon>
                  </template>
                </NButton>
              </template>
              Do you want to remove this command?
            </NPopconfirm>
          </template>
          Delete Command
        </NTooltip>
      </template>

      <NTooltip v-else>
        <template #trigger>
          <NButton v-on:click="copyPayload" text type="primary">
            <template #icon>
              <NIcon><Copy16Filled/></NIcon>
            </template>
          </NButton>
        </template>
        Copy Payload
      </NTooltip>
    </NFlex>
  </div>
</template>