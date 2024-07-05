<script setup>
  import { computed, watch, ref } from 'vue';
  import { NModal, NFormItem, NSelect, NInput, NCheckbox, NFlex, NButton, useNotification, NForm  } from 'naive-ui';
  import { ModalAction, useGlobalState, defaultActionModal } from '../store';
  import { useFetch } from '@vueuse/core';

  const {
    hasNewDataCommand,
    dataCommands,
    flowCommands,
    flowCommandTypes,
    actionModal,
    dataCommandTypes,
    sheetType,
    apiURL,
    apiToken,
    isLiveAPI
  } = useGlobalState();

  const isLoading = ref(false);

  const beautifiedPayload = ref('');
  const payload = computed(() => actionModal.value.data.payload);
  watch(payload, (value) => {
    beautifiedPayload.value = '';

    if (value !== null && beautifiedPayload.value === '') {
      beautifiedPayload.value =  JSON.stringify(JSON.parse(value), null, 2);
      return;
    }

    return;
  }, { deep: true });

  const notification = useNotification();
  const commandTypes = computed(() => actionModal.value.type === 'dataCommand' ? dataCommandTypes.value : flowCommandTypes.value);

  const modalTitle = computed(() => {
    const { action } = actionModal.value;

    if (action === ModalAction.AddDataCommand) {
      return 'Add Data Command';
    }

    if (action === ModalAction.UpdateDataCommand) {
      return 'Update Data Command';
    }

    if (action === ModalAction.AddFlowCommand) {
      return 'Add Flow Command';
    }

    if (action === ModalAction.UpdateFlowCommand) {
      return 'Update Flow Commad';
    }

    return;
  });

  function isValidJSON(jsonString) {
    try {
        JSON.parse(jsonString);
        return true;
    } catch (error) {
        return false;
    }
  }

  function proceed() {
    const { action } = actionModal.value;

    if (action === ModalAction.AddDataCommand) {
      addDataCommand();
      return;
    }

    if (action === ModalAction.UpdateDataCommand) {
      updateDataCommand();
      return;
    }

    if (action === ModalAction.AddFlowCommand) {
      addFlowCommand();
      return;
    }

    if (action === ModalAction.UpdateFlowCommand) {
      updateFlowCommand();
      return;
    }

    return;
  }

  function unbeautifyPayload(payload) {
    if (payload === null || payload === '') {
      return null;
    }

    return JSON.stringify(JSON.parse(payload), null, 0);
  }

  // Data Commands
  async function addDataCommand() {
    const { commandType, field, reload, order } = actionModal.value.data;
    if (commandType === null) {
      notification.error({ content: 'Please select Command Type!', duration: 2500 });
      return;
    }

    if (field === null) {
      notification.error({ content: 'Please input a value for Field!', duration: 2500 });
      return;
    }

    if (sheetType.value === null) {
      notification.error({ content: 'Please select Sheet Type!', duration: 2500 });
      return;
    }

    if (beautifiedPayload.value === '') {
      notification.error({ content: 'Please input a value for Payload!', duration: 2500 });
      return;
    }

    if (!isValidJSON(beautifiedPayload.value)) {
      notification.error({ content: 'Invalid JSON for Payload!', duration: 2500 });
      return;
    }

    const body = {
      frozen_import_sheet_type_id: sheetType.value,
      data_command_type_id       : commandType,
      field                      : field,
      reload                     : reload,
      payload                    : unbeautifyPayload(beautifiedPayload.value),
      order                      : order
    };

    isLoading.value = true;

    const { statusCode, data } = await useFetch(`${apiURL.value}/frozen-import-data-commands`, { headers: { Authorization: apiToken.value, Gui: 'Case Management', 'Use-Live-Api-For-Import-Frozen': +isLiveAPI.value }})
      .json()
      .post(body);

    isLoading.value = false;

    if (statusCode.value !== 201) {
      notification.error({ content: 'Something went wrong while saving Data Command!', duration: 2500 });
      return;
    }

    const dataCommand       = data.value;
    dataCommands.value      = [ dataCommand, ...dataCommands.value ];
    hasNewDataCommand.value = true;

    beautifiedPayload.value = '';
    actionModal.value = JSON.parse(defaultActionModal);
  }

  async function updateDataCommand() {
    const dataCommand = actionModal.value.data;

    const body = {
      frozen_import_sheet_type_id: sheetType.value,
      data_command_type_id       : dataCommand.commandType,
      field                      : dataCommand.field,
      reload                     : dataCommand.reload,
      payload                    : unbeautifyPayload(beautifiedPayload.value),
      order                      : dataCommand.order
    };

    isLoading.value = true;

    const { statusCode } = await useFetch(`${apiURL.value}/frozen-import-data-commands/${dataCommand.id}`, { headers: { Authorization: apiToken.value, Gui: 'Case Management', 'Use-Live-Api-For-Import-Frozen': +isLiveAPI.value }})
      .json()
      .patch(body);

    isLoading.value = false;

    if (statusCode.value !== 200) {
      notification.error({ content: 'Something went wrong while updating Data Command!', duration: 2500 });
      return;
    }

    dataCommands.value = dataCommands.value.map(item => {
      if (item.id !== dataCommand.id) {
        return item;
      }

      item.data_command_type_id = dataCommand.commandType;
      item.field                = dataCommand.field;
      item.reload               = dataCommand.reload;
      item.payload              = body.payload;
      item.order                = dataCommand.order;

      return item;
    });

    beautifiedPayload.value = '';
    actionModal.value = JSON.parse(defaultActionModal);
  }

  // Flow Commands
  const parentCommands = computed(() => {
    const flowCommandName = (id) => flowCommandTypes.value.find(flowCommandType =>  flowCommandType.value === id).label;
    return flowCommands.value.map(item => ({ label: `(${item.id}) ${flowCommandName(item.flow_command_type_id)}`, value: item.id }));
  });

  async function addFlowCommand() {
    const { parentCommand, commandType, order } = actionModal.value.data;

    const body = {
      frozen_import_sheet_type_id: sheetType.value,
      parent_id                  : parentCommand,
      flow_command_type_id       : commandType,
      payload                    : unbeautifyPayload(beautifiedPayload.value),
      order
    };

    isLoading.value = true;

    const { statusCode, data } = await useFetch(`${apiURL.value}/frozen-import-flow-commands`, { headers: { Authorization: apiToken.value, Gui: 'Case Management', 'Use-Live-Api-For-Import-Frozen': +isLiveAPI.value }})
      .json()
      .post(body);

    isLoading.value = false;

    if (statusCode.value !== 201) {
      notification.error({ content: 'Something went wrong while adding Flow Command!', duration: 2500 });
      return;
    }

    const flowCommand = data.value;
    flowCommands.value = [ ...flowCommands.value, flowCommand ];

    beautifiedPayload.value = '';
    actionModal.value = JSON.parse(defaultActionModal);
  }

  async function updateFlowCommand() {
    const flowCommand = actionModal.value.data;

    const body = {
      frozen_import_sheet_type_id: sheetType.value,
      parent_id                  : flowCommand.parentCommand,
      flow_command_type_id       : flowCommand.commandType,
      payload                    : unbeautifyPayload(beautifiedPayload.value),
      order                      : flowCommand.order
    };

    isLoading.value = true;

    const { statusCode } = await useFetch(`${apiURL.value}/frozen-import-flow-commands/${flowCommand.id}`, { headers: { Authorization: apiToken.value, Gui: 'Case Management', 'Use-Live-Api-For-Import-Frozen': +isLiveAPI.value }})
      .json()
      .patch(body);

    isLoading.value = false;

    if (statusCode.value !== 200) {
      notification.error({ content: 'Something went wrong while updating Flow Command!', duration: 2500 });
      return;
    }

    flowCommands.value = flowCommands.value.map(item => {
      if (item.id !== flowCommand.id) {
        return item;
      }

      item.parent_id            = flowCommand.parentCommand;
      item.flow_command_type_id = flowCommand.commandType;
      item.payload              = body.payload;
      item.order                = flowCommand.order;

      return item;
    });

    beautifiedPayload.value = '';
    actionModal.value = JSON.parse(defaultActionModal);
  }

  function beautifyPayload() {
    beautifiedPayload.value = JSON.stringify(JSON.parse(beautifiedPayload.value), null, 2);
  }
</script>

<template>
  <NModal
    class="w-[800px]"
    v-model:show="actionModal.show"
    :title="modalTitle"
    :mask-closable="false"
    preset="card"
  >
    <NFormItem v-if="actionModal.type === 'flowCommand'" label="Parent Command">
      <NSelect
        v-on:keyup.ctrl.enter="proceed"
        v-model:value="actionModal.data.parentCommand"
        :options="parentCommands"
        placeholder="Select Parent Command"
        filterable
      />
    </NFormItem>

    <NFormItem label="Command Type">
      <NSelect
        v-on:keyup.ctrl.enter="proceed"
        v-model:value="actionModal.data.commandType"
        :options="commandTypes"
        placeholder="Select Command Type"
        filterable
      />
    </NFormItem>

    <template v-if="actionModal.type === 'dataCommand'">
      <NFormItem label="Field">
        <NInput v-on:keyup.ctrl.enter="proceed" type="text" v-model:value="actionModal.data.field"/>
      </NFormItem>

      <NCheckbox
        v-model:checked="actionModal.data.reload"
      >
        Reload
      </NCheckbox>
    </template>

    <NFormItem class="mt-5" label="Payload">
      <NInput
        v-on:keyup.ctrl.enter="proceed"
        v-on:keydown.ctrl.shift.f="beautifyPayload"
        type="textarea"
        rows="10"
        v-model:value="beautifiedPayload"
      />
    </NFormItem>

    <NFormItem class="mt-5" label="Order">
      <NInput v-on:keyup.ctrl.enter="proceed" type="number" v-model:value="actionModal.data.order"/>
    </NFormItem>

    <template #footer>
      <NFlex justify="end">
        <NButton v-on:click="proceed" :loading="isLoading" ghost type="primary">Proceed</NButton>
        <NButton v-on:click="actionModal = JSON.parse(defaultActionModal)">Close</NButton>
      </NFlex>
    </template>
  </NModal>
</template>