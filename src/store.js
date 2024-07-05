import { createGlobalState, useFetch } from '@vueuse/core';
import { ref, readonly, watch, computed } from 'vue';

const isLiveAPI = ref(true);

const apiToken = readonly(ref(import.meta.env.VITE_API_TOKEN));
const apiURL = computed(() => {
  return isLiveAPI.value ? import.meta.env.VITE_API_URL_LIVE : import.meta.env.VITE_API_URL_STAGE;
})

async function get(endpoint, callback) {
  const headers = { Authorization: apiToken.value, GUI: 'Case Management', 'Use-Live-Api-For-Import-Frozen' : +isLiveAPI.value };
  const url = `${apiURL.value}/${endpoint}`;
  
  const { data } = await useFetch(url, { method: 'GET', headers});

  const items = JSON.parse(data.value).data;

  callback(items);
}

/**
 * @typedef { Object } DefaultActionModal
 * @property { boolean } show - Indicates whether the item is shown or not.
 * @property { 'dataCommand' | 'flowCommand' } type
 * @property { number } action - Action associated with the item.
 * @property { boolean } isLoading - Indicates whether the item is in a loading state or not.
 * @property { Object } data - Data object containing various properties.
 * @property { number } data.id - The ID of the data.
 * @property { number } data.parentCommand
 * @property { number } data.commandType - The type of command associated with the data.
 * @property { string } data.field - The field associated with the data.
 * @property { number } data.reload - The reload state of the data.
 * @property { string } data.payload - The payload associated with the data.
 * @property { string } data.order - The order of the data.
 */

/**
 * @template T
 * @typedef { import('vue').Ref<T> } Ref<T>
 */

export const defaultActionModal = JSON.stringify({
  show: false,
  type: null,
  action: null,
  data: {
    id         : null,
    parentCommand: null,
    commandType: null,
    field      : null,
    reload     : 0,
    payload    : null,
    order      : '1',
  }
});

/**
 * @typedef {Object} ModalAction
 * @description Enum type representing different modal actions.
 * @property {number} AddDataCommand
 * @property {number} UpdateDataCommand
 * @property {number} RemoveDataCommand
 * @property {number} AddFlowCommand
 * @property {number} UpdateFlowCommand
 * @property {number} RemoveFlowCommand
 */
export const ModalAction = Object.freeze({
  AddDataCommand   : 1,
  UpdateDataCommand: 2,
  RemoveDataCommand: 3,
  AddFlowCommand   : 4,
  UpdateFlowCommand: 5,
  RemoveFlowCommand: 6
});

export const useGlobalState = createGlobalState(() => {
  const paymentTypes      = ref([]);
  const paymentType       = ref(null);
  const fileTypes         = ref([]);
  const fileType          = ref(null);
  const sheetTypes        = ref([]);
  const sheetType         = ref(null);
  const flowCommandTypes  = ref([]);
  const dataCommandTypes  = ref([]);
  const flowCommands      = ref([]);
  const dataCommands      = ref([]);
  const hasNewDataCommand = ref(false);
  const hasDraggedPayload = ref(false);

  /** @type { Ref<DefaultActionModal> } */
  const actionModal = ref(JSON.parse(defaultActionModal));

  get('payment-types?page_size=1000', (items) => paymentTypes.value = items.map(item => ({ label: item.payment_name, value: item.id })));
  get('frozen-import-file-types?page_size=1000', (items) => fileTypes.value = items.map(item => ({ label: item.name, value: item.id, paymentTypeId: item.payment_type_id })));
  get('frozen-import-sheet-types?page_size=1000', (items) => sheetTypes.value = items.map(item => ({ label: item.name, value: item.id, fileTypeId: item.frozen_import_file_type_id })));
  get('flow-command-types?page_size=1000', (items) => flowCommandTypes.value = items.map(item => ({ label: item.name, value: item.id })));
  get('data-command-types?page_size=1000', (items) => dataCommandTypes.value = items.map(item => ({ label: item.name, value: item.id })));

  watch(sheetType, async function(id) {
    get('frozen-import-data-commands?page_size=1000', (items) => dataCommands.value = items.filter(item => item.frozen_import_sheet_type_id === id || item.frozen_import_sheet_type_id === null));
    get(`frozen-import-flow-commands?filter[frozen_import_sheet_type_id]=${id}&page_size=1000`, (items) => flowCommands.value = items.filter(item => item.frozen_import_sheet_type_id === id || item.frozen_import_sheet_type_id === null));
  });

  watch(isLiveAPI, () => {
    paymentTypes.value      = [];
    paymentType.value       = [];
    fileTypes.value         = [];
    fileType.value          = [];
    sheetTypes.value        = [];
    sheetType.value         = [];
    flowCommandTypes.value  = [];
    dataCommandTypes.value  = [];
    flowCommands.value      = [];
    dataCommands.value      = [];
    hasNewDataCommand.value = false;
    hasDraggedPayload.value = false;

    get('payment-types?page_size=1000', (items) => paymentTypes.value = items.map(item => ({ label: item.payment_name, value: item.id })));
    get('frozen-import-file-types?page_size=1000', (items) => fileTypes.value = items.map(item => ({ label: item.name, value: item.id, paymentTypeId: item.payment_type_id })));
    get('frozen-import-sheet-types?page_size=1000', (items) => sheetTypes.value = items.map(item => ({ label: item.name, value: item.id, fileTypeId: item.frozen_import_file_type_id })));
    get('flow-command-types?page_size=1000', (items) => flowCommandTypes.value = items.map(item => ({ label: item.name, value: item.id })));
    get('data-command-types?page_size=1000', (items) => dataCommandTypes.value = items.map(item => ({ label: item.name, value: item.id })));
  });

  return {
    apiToken,
    apiURL,
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
    isLiveAPI
  };
});