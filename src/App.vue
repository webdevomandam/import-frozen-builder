<script setup lang="jsx">
  import { computed, watch, ref } from 'vue';
  import { 
    NSelect,
    NFormItem,
    NCard,
    NButton,
    NConfigProvider,
    NTree,
    NNotificationProvider
  } from 'naive-ui';

  import CommandButtonGroup from './components/CommandButtonGroup.vue';
  import CommandModal from './components/CommandModal.vue';

  import { useGlobalState, ModalAction, defaultActionModal } from './store'

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
    hasNewDataCommand
  } = useGlobalState();

  const fileTypesByPaymentType = computed(() => {
    return fileTypes.value.filter(fileType => fileType.paymentTypeId === paymentType.value);
  });

  const sheetTypesByFileType = computed(() => {
    return sheetTypes.value.filter(sheetType => sheetType.fileTypeId === fileType.value);
  });

  const flowCommandsBySheetType =  computed(() => {
    const data = flowCommands.value
      .filter(flowCommand => flowCommand.frozen_import_sheet_type_id === sheetType.value)
      .sort((a, b) => {

        return a.parent_id !== b.parent_id 
          ? a.parent_id - b.parent_id 
          : a.order - b.order;
      });

      function nestData(data, parentId = null) {
        const nestedData = [];

        for (const item of data) {
          if (item.parent_id === parentId) {
            const children = nestData(data, item.id);
            item.flowCommandTypeName = flowCommandTypes.value.find(flowCommandType => flowCommandType.value === item.flow_command_type_id).label;
            item.label = `${item.flowCommandTypeName} (${item.id})`;
            item.key = item.id;

            item.children = children;
            item.suffix = () => <CommandButtonGroup/>

            if (item.payload !== null) {
              item.children = [
                { label:item.payload, key: item.id }, ...item.children
              ]
            }

            nestedData.push(item);
          }
        }

        return nestedData.sort((a, b) => a.order - b.order);
      }

      const nestedAndOrderedData = nestData(data);
      return nestedAndOrderedData;
  });

  const dataCommandsBySheetType = computed(() => {
    if (sheetType.value === null) {
      return [];
    }

    console.log(dataCommands.value);

    const data = dataCommands.value
      .filter(dataCommand => dataCommand.frozen_import_sheet_type_id === sheetType.value || dataCommand.frozen_import_sheet_type_id === null)
      .map(dataCommand => {
        const dataCommandTypeName = dataCommandTypes.value.find(dataCommanType => dataCommanType.value === dataCommand.data_command_type_id).label;
        const child = { label: dataCommand.payload, key: dataCommand.id };
        dataCommand.key = dataCommand.field;
        dataCommand.label = `${dataCommand.field} (${dataCommandTypeName})`;

        return {...dataCommand, dataCommandTypeName, children: [child], suffix: () => <CommandButtonGroup action={ModalAction.UpdateDataCommand} data={dataCommand}/> }
      })
      .sort((a, b) => b.id - a.id);

    return data;
  });

  // Expand first data command when there is new data command added.
  const expandedKeys = ref([]);
  watch(hasNewDataCommand, function(value) {
    if (!value) return;

    const { key } = dataCommandsBySheetType.value.at(0);
    setTimeout(() => {
      expandedKeys.value = [key];
      hasNewDataCommand.value = false;
    }, 0);
  });
</script>

<template>
  <NConfigProvider>
    <NNotificationProvider placement="bottom-left">
      <div class="p-4">
        <section class="flex gap-4 items-center">
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
            title="Data Commands"
            :segmented="{ content: true }"
          >
            <template #header-extra>
              <NButton
                type="primary"
                @click="actionModal = { ...JSON.parse(defaultActionModal), show: true, action: ModalAction.AddDataCommand }"
                ghost
              >
                New Data Command
              </NButton>
            </template>
            <NTree
              :data="dataCommandsBySheetType"
              :default-expanded-keys="expandedKeys"
              expand-on-click
              block-line
            />
          </NCard>

          <NCard
            title="Flow Commands"
            :segmented="{ content: true }"
          >
            <template #header-extra>
              <NButton type="primary" ghost>New Flow Command</NButton>
            </template>
            <!-- <NTree
              :data="flowCommandsBySheetType"
              default-expand-all
              expand-on-click
              show-line
              draggable
            /> -->
          </NCard>
        </section>
      </div>
      <CommandModal/>
    </NNotificationProvider>
  </NConfigProvider>
</template>

<style scoped>

</style>
