<script setup lang="jsx">
  import { computed, watch, ref } from 'vue';
  import { 
    NSelect,
    NFormItem,
    NCard,
    NButton,
    NConfigProvider,
    NTree,
    NNotificationProvider,
    darkTheme,
    NGlobalStyle,
    NSwitch,
    NFlex,
  } from 'naive-ui';

  import CommandButtonGroup from './components/CommandButtonGroup.vue';
  import CommandModal from './components/CommandModal.vue';
  import PreviewPayload from './components/PreviewPayload.vue';

  import { useGlobalState, ModalAction, defaultActionModal } from './store';
  import { useFetch, useTitle } from '@vueuse/core';

  const {
    paymentTypes,
    paymentType,
    fileTypes,
    fileType,
    sheetTypes,
    sheetType,
    flowCommandTypes,
    dataCommandTypes,
    flowCommands,
    dataCommands,
    actionModal,
    hasNewDataCommand,
    hasDraggedPayload,
    apiToken,
    apiURL,
    isLiveAPI
  } = useGlobalState();

  watch(isLiveAPI, (isLiveAPI) => {
    const title = useTitle();
    const prefix = isLiveAPI ? 'API Live' : 'API Stage';
    title.value = prefix + ' | Import Frozen Builder';
  }, { immediate: true });

  const shouldExpandAll = ref(false);

  const fileTypesByPaymentType = computed(() => {
    return fileTypes.value.filter(fileType => fileType.paymentTypeId === paymentType.value);
  });

  const sheetTypesByFileType = computed(() => {
    return sheetTypes.value.filter(sheetType => sheetType.fileTypeId === fileType.value);
  });

  const dataCommandsTree = computed(() => {
    const __dataCommands = JSON.parse(JSON.stringify(dataCommands.value));

    return __dataCommands
      .map(dataCommand => {
        const dataCommandTypeName = dataCommandTypes.value
          .find(dataCommanType => dataCommanType.value === dataCommand.data_command_type_id).label;

        // dataCommand.key = dataCommand.field;
        dataCommand.key = `${dataCommand.id} - ${dataCommand.data_command_type_id}`;
        dataCommand.label = `${dataCommand.field} (${dataCommandTypeName})`;

        return {
          ...dataCommand,
          dataCommandTypeName,
          children: [ { label: dataCommand.payload, key: dataCommand.id, suffix: () => <CommandButtonGroup command='dataCommand' isPayload data={dataCommand}/>  } ],
          prefix: () => <NButton type='primary' text>{ dataCommand.frozen_import_sheet_type_id === null ? 'GLO' : 'LOC' }</NButton>,
          suffix: () => <CommandButtonGroup command='dataCommand' updateAction={ModalAction.UpdateDataCommand} removeAction={ModalAction.RemoveDataCommand} data={dataCommand}/> 
        }
      })
      .sort((a, b) => b.id - a.id);
  });

  const flowCommandsTree = computed(() => {
    const __flowCommands = JSON.parse(JSON.stringify(flowCommands.value));

    const data = __flowCommands
      .sort((a, b) => a.parent_id !== b.parent_id ? a.parent_id - b.parent_id : a.order - b.order);

    function nestAndOrderData(flowCommands, parentId = null) {
      const nestedData = [];

      for (const flowCommand of flowCommands) {
        if (flowCommand.parent_id === parentId) {
          const children = nestAndOrderData(data, flowCommand.id);
          flowCommand.flowCommandTypeName = flowCommandTypes.value.find(flowCommandType => flowCommandType.value === flowCommand.flow_command_type_id).label;
          flowCommand.label = `${flowCommand.flowCommandTypeName} (${flowCommand.id})`;
          flowCommand.key = `${flowCommand.id} - ${flowCommand.flow_command_type_id}`;

          flowCommand.children = children;
          flowCommand.prefix = () => <NButton text type='primary'>Order: {flowCommand.order}</NButton>
          flowCommand.suffix = () => <CommandButtonGroup command='flowCommand' updateAction={ModalAction.UpdateFlowCommand} removeAction={ModalAction.RemoveFlowCommand} data={flowCommand}/>
          flowCommand.isPayload = false;

          if (flowCommand.payload !== null) {
            flowCommand.children = [
              {
                label: flowCommand.payload,
                key: `${flowCommand.id} - payload`,
                prefix: () => <PreviewPayload payload={flowCommand.payload} />,
                suffix: () => <CommandButtonGroup command="flowCommand" isPayload data={flowCommand}/>,
                isPayload: true,
                id: flowCommand.id
              },
               ...flowCommand.children
            ];
          }

          nestedData.push(flowCommand);
        }
      }

      return nestedData.sort((a, b) => a.order - b.order);
    }

    const nestedAndOrderedData = nestAndOrderData(data);
    return nestedAndOrderedData;
  });

  // Expand first data command when there is new data command added.
  const expandedKeys = ref([]);
  watch(hasNewDataCommand, function(value) {
    if (!value) return;

    const { key } = dataCommandsTree.value.at(0);
    setTimeout(() => {
      expandedKeys.value = [key];
      hasNewDataCommand.value = false;
    }, 0);
  });

  async function handleDrop({ node, dragNode, dropPosition}) {
    const { id: parentId } = node;
    const { id, isPayload } = dragNode;

    if (isPayload) {
      hasDraggedPayload.value = true;
      return;
    }

    const headers = { Authorization: apiToken.value, Gui: 'Case Management', 'Is-Live-Api': +isLiveAPI.value };

    const { statusCode } = await useFetch(`${apiURL.value}/frozen-import-flow-commands/${id}`, { headers })
      .json()
      .patch({ parent_id: parentId });

    if (statusCode.value !== 200) {
      console.log('Something went wrong while updating flow command.');
      return;
    }

    flowCommands.value = flowCommands.value.map(flowCommand => {
      if (flowCommand.id === id) { 
        flowCommand.parent_id = parentId;
      }

      return flowCommand
    });
  }

  const flowCommandsExpandedKeys = ref([]);

  function setExpandedKeys() {
    if (flowCommandsExpandedKeys.value.length !== 0) {
      flowCommandsExpandedKeys.value = [];
      return;
    }

    flowCommandsExpandedKeys.value = flowCommands.value.map(flowCommand => `${flowCommand.id} - ${flowCommand.flow_command_type_id}`);
  }

</script>

<template>
  <NConfigProvider :theme="darkTheme">
    <NGlobalStyle/>
    <NNotificationProvider placement="bottom-left">
        <div class="p-4">
          <section class="flex mb-4 gap-2">
            <NSwitch v-model:value="isLiveAPI" size="small"/>
            <p>Use Live API?</p>
          </section>
          <section class="flex gap-4 items-center">
            <!-- <NButton class="mr-auto" type="primary" ghost>Add Sheet Type</NButton> -->

            <NFormItem class="w-1/5" label="Payment Type" path="selectValue">
              <NSelect
                v-model:value="paymentType"
                :options="paymentTypes"
                placeholder="Select Payment Type"
                filterable
              />
            </NFormItem>

            <NFormItem class="w-1/5" label="File Type" path="selectValue">
              <NSelect
                v-model:value="fileType"
                :options="fileTypesByPaymentType"
                :disabled="paymentType === null"
                placeholder="Select File Type"
                filterable
              />
            </NFormItem>

            <NFormItem class="w-1/5" label="Sheet Type" path="selectValue">
              <NSelect
                v-model:value="sheetType"
                :options="sheetTypesByFileType"
                :disabled="fileType === null"
                placeholder="Select Sheet Type"
                filterable
              />
            </NFormItem>
          </section>

          <section class="flex gap-4">
            <NCard
              class="w-1/2"
              :title="`Data Commands (${dataCommands.length})`"
              :segmented="{ content: true }"
            >
              <template #header-extra>
                <NButton
                  v-on:click="actionModal = { ...JSON.parse(defaultActionModal), show: true, action: ModalAction.AddDataCommand, type: 'dataCommand' }"
                  type="primary"
                  ghost
                >
                  New Data Command
                </NButton>
              </template>
                 <NTree
                :data="dataCommandsTree"
                :default-expanded-keys="expandedKeys"
                block-line
              />
            </NCard>

            <NCard
              :title="`Flow Commands (${flowCommands.length})`"
              :segmented="{ content: true }"
            >
              <template #header-extra>
                <NButton
                  v-on:click="actionModal = { ...JSON.parse(defaultActionModal), show: true, action: ModalAction.AddFlowCommand, type: 'flowCommand' }"
                  type="primary"
                  ghost
                >
                  New Flow Command
                </NButton>
              </template>

              <NFlex class="mb-2" v-if="flowCommands.length" align="start">
                <!-- <NSwitch id="expand-all" class="mb-2" v-model:value="shouldExpandAll" size="small"/> -->
                <NSwitch id="expand-all" class="mb-2" v-on:change="setExpandedKeys" size="small"/>
                <p>Expand All</p>
              </NFlex>
              <!-- :default-expand-all="shouldExpandAll" -->
              <NTree
                :data="flowCommandsTree"
                :default-expanded-keys="flowCommandsExpandedKeys"
                draggable
                show-line
                block-line
                @drop="handleDrop"
              />
            </NCard>
          </section>
        </div>
      <CommandModal/>
    </NNotificationProvider>
  </NConfigProvider>
</template>

<style>
  .command-button-group {
    display: none;
  }

  .n-tree-node-wrapper:hover .command-button-group {
    display: block;
  }
</style>