<script setup>
  import { ref, computed } from 'vue';
  import { NModal, NFormItem, NSelect, NInput, NCheckbox, NFlex, NButton, useNotification  } from 'naive-ui';
  import { ModalAction, useGlobalState, defaultActionModal } from '../store';
  import { useFetch } from '@vueuse/core'

  const { hasNewDataCommand, dataCommands, actionModal, dataCommandTypes, sheetType, apiURL, apiToken } = useGlobalState();

  const notification = useNotification()

  const modalTitle = computed(() => {
    const { action } = actionModal.value;

    if (action === 1) {
      return 'Add Data Command';
    }

    if (action === 2) {
      return 'Update Data Command';
    }

    if (action === 3) {
      return 'Delete Data Command';
    }

    if (action === 4) {
      return 'Add Flow Command';
    }

    if (action === 5) {
      return 'Update Flow Command';
    }

    if (action === 6) {
      return 'Delete Flow Command';
    }
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

    return;
  }

  async function addDataCommand() {
    const { commandType, field, payload, reload, order } = actionModal.value.data;
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

    if (payload === null) {
      notification.error({ content: 'Please input a value for Payload!', duration: 2500 });
      return;
    }

    if (!isValidJSON(payload)) {
      notification.error({ content: 'Invalid JSON for Payload!', duration: 2500 });
      return;
    }

    const body = {
      frozen_import_sheet_type_id: sheetType.value,
      data_command_type_id       : commandType,
      field                      : field,
      reload                     : reload,
      payload                    : payload,
      order                      : order
    };

    actionModal.value.isLoading = true;

    const { statusCode, data } = await useFetch(`${apiURL.value}/frozen-import-data-commands`, { headers: { Authorization: apiToken.value, Gui: 'Case Management' }})
      .json()
      .post(body);

      actionModal.value.isLoading = false;

    if (statusCode.value !== 201) {
      notification.error({ content: 'Something went wrong while saving Data Command!', duration: 2500 });
      return;
    }

    const dataCommand       = data.value;
    dataCommands.value      = [ dataCommand, ...dataCommands.value ];
    hasNewDataCommand.value = true;

    actionModal.value = JSON.parse(defaultActionModal);
  }

  async function updateDataCommand() {
    const dataCommand = actionModal.value.data;

    const body = {
      frozen_import_sheet_type_id: sheetType.value,
      data_command_type_id       : dataCommand.commandType,
      field                      : dataCommand.field,
      reload                     : dataCommand.reload,
      payload                    : dataCommand.payload,
      order                      : dataCommand.order
    };

    actionModal.value.isLoading = true;

    const { statusCode, data } = await useFetch(`${apiURL.value}/frozen-import-data-commands/${dataCommand.id}`, { headers: { Authorization: apiToken.value, Gui: 'Case Management' }})
      .json()
      .patch(body);

    actionModal.value = JSON.parse(defaultActionModal);

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
      item.payload              = dataCommand.payload;
      item.order                = dataCommand.order;

      console.log(item);

      return item;
    });
  }

</script>

<template>
  <NModal
    class="w-[600px]"
    v-model:show="actionModal.show"
    :title="modalTitle"
    :mask-closable="false"
    preset="card"
  >
    <NFormItem label="Command Type">
      <NSelect
        v-model:value="actionModal.data.commandType"
        :options="dataCommandTypes"
        placeholder="Select Payment Type"
        filterable
      />
    </NFormItem>

    <NFormItem label="Field">
      <NInput type="text" v-model:value="actionModal.data.field"/>
    </NFormItem>

    <NCheckbox v-model:checked="actionModal.data.reload">
      Reload
    </NCheckbox>

    <NFormItem class="mt-5" label="Payload">
      <NInput type="textarea" v-model:value="actionModal.data.payload"/>
    </NFormItem>

    <NFormItem class="mt-5" label="Order">
      <NInput type="number" v-model:value="actionModal.data.order"/>
    </NFormItem>
    <template #footer>
      <NFlex justify="end">
        <NButton @click="proceed" :loading="actionModal.isLoading" ghost type="primary">Proceed</NButton>
        <NButton @click="actionModal = JSON.parse(defaultActionModal)">Close</NButton>
      </NFlex>
    </template>
  </NModal>
</template>