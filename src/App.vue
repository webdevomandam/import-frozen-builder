<script setup lang="jsx">
  import { ref, computed, onMounted, h } from 'vue';
  import { useFetch, useDark } from '@vueuse/core';
  import { NSelect, NFormItem, NCard, NButton, NConfigProvider, NTree, NIcon, darkTheme } from 'naive-ui';
  import { Edit20Filled } from '@vicons/fluent'

  const apiToken = import.meta.env.VITE_API_TOKEN;
  const apiURL = import.meta.env.VITE_API_URL;

  async function fetch(method, endpoint) {
    const { data } = await useFetch(apiURL + '/' + endpoint, { method, headers: { Authorization: apiToken, GUI: 'Case Management' }});

    return JSON.parse(data.value).data;
  }

  const paymentTypes = ref([]);
  const paymentType = ref({});

  async function getPaymenTypes() {
    const data = await fetch('GET', 'payment-types?page_size=1000');
    paymentTypes.value = data.map(paymentType => ({ id: paymentType.id, name: paymentType.payment_name }));
  }

  const fileTypes = ref([]);
  async function getFileTypes() {
    const data = await fetch('GET', 'frozen-import-file-types?page_size=1000');
    fileTypes.value = data.map(fileType => ({ id: fileType.id, name: fileType.name, paymentTypeId: fileType.payment_type_id }));
  }

  const sheetTypes = ref([]);
  async function getSheetTypes() {
    const data = await fetch('GET', 'frozen-import-sheet-types?page_size=1000');
    sheetTypes.value = data.map(sheetType => ({ id: sheetType.id, name: sheetType.name, fileTypeId: sheetType.frozen_import_file_type_id }));
  }

  const flowCommandTypes = ref([]);
  async function getFlowCommandTypes() {
    flowCommandTypes.value = await fetch('GET', 'flow-command-types?page_size=1000');
  }

  const dataCommandTypes = ref([]);
  async function getDataCommandTypes() {
    dataCommandTypes.value= await fetch('GET', 'data-command-types?page_size=1000');
  };

  const flowCommands = ref([]);
  async function getFlowCommands() {
    flowCommands.value = await fetch('GET', 'frozen-import-flow-commands?page_size=100000');
  }

  const dataCommands = ref([]);
  async function getDataCommands() {
    dataCommands.value = await fetch('GET', 'frozen-import-data-commands?page_size=1000');
  }

  onMounted(() => {
    useDark();
    getPaymenTypes();
    getFileTypes();
    getSheetTypes();
    getFlowCommandTypes();
    getDataCommandTypes();
    getFlowCommands();
    getDataCommands();
  });

  const fileType = ref({});
  const fileTypesByPaymentType = computed(() => {
    const { id } = paymentType.value;
    return fileTypes.value.filter(fileType => fileType.paymentTypeId === id);
  });

  const sheetType = ref({});
  const sheetTypesByFileType = computed(() => {
    const { id } = fileType.value;
    return sheetTypes.value.filter(sheetType => sheetType.fileTypeId === id);
  });

  const flowCommandsBySheetType =  computed(() => {
    const { id } = sheetType.value;
    const data = flowCommands.value
      .filter(flowCommand => flowCommand.frozen_import_sheet_type_id === 32 /* id */)
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
            item.flowCommandTypeName = flowCommandTypes.value.find(flowCommandType => flowCommandType.id === item.flow_command_type_id).name;
            item.label = `${item.flowCommandTypeName} (${item.id})`;
            item.key = item.id;

            item.children = children;

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
    const { id } = sheetType.value;
    const data = dataCommands.value
      .filter(({ frozen_import_sheet_type_id }) => frozen_import_sheet_type_id === id || frozen_import_sheet_type_id === null)
      .map(dataCommand => {
        const dataCommandTypeName = dataCommandTypes.value.find(dataCommanType => dataCommanType.id === dataCommand.data_command_type_id).name;
        const child = { label: dataCommand.payload, key: dataCommand.id };
        dataCommand.key = dataCommand.field;
        dataCommand.label = `${dataCommand.field} (${dataCommandTypeName})`;

        // <NIcon className="mr-2" onClick={() => console.log('here')} size="15" component={<Edit20Filled/>}/>
        return {...dataCommand, dataCommandTypeName, children: [child], suffix: () => <Nbutton text class="pl-1" ><NIcon><Edit20Filled /></NIcon></Nbutton>}
      });

    return data;
  });

</script>

<template>
  <n-config-provider>
    <div class="p-4">
      <section class="flex gap-4 items-center">
        <n-form-item class="w-1/5" label="Select" path="selectValue">
          <n-select
            filterable
            placeholder="Payment Types"
          />
        </n-form-item>

        <n-form-item class="w-1/5" label="Select" path="selectValue">
          <n-select
            filterable
            placeholder="Payment Types"
          />
        </n-form-item>

        <n-form-item class="w-1/5" label="Select" path="selectValue">
          <n-select
            filterable
            placeholder="Payment Types"
          />
        </n-form-item>

        <n-button type="primary">Display</n-button>
      </section>

      <section class="flex gap-4">
        <n-card
          title="Flow Commands"
          :segmented="{ content: true }"
        >
          <template #header-extra>
            <n-button type="primary" ghost>New Flow Command</n-button>
          </template>
          <n-tree
            :data="flowCommandsBySheetType"
            default-expand-all
            expand-on-click
            show-line
            draggable
          />
        </n-card>
        <n-card
          title="Data Commands"
          :segmented="{ content: true }"
        >
          <template #header-extra>
            <n-button type="primary" ghost>New Data Command</n-button>
          </template>
          <n-tree expand-on-click :data="dataCommandsBySheetType"/>
        </n-card>
      </section>
    </div>
  </n-config-provider>
</template>

<style scoped>

</style>
