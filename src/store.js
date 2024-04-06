import { createGlobalState, useFetch } from '@vueuse/core';
import { ref, readonly, reactive } from 'vue';

const apiToken = readonly(ref(import.meta.env.VITE_API_TOKEN));
const apiURL = readonly(ref(import.meta.env.VITE_API_URL));

async function get(endpoint, callback) {
  const { data } = await useFetch(`${apiURL.value}/${endpoint}?page_size=1000000`, { method: 'GET', headers: { Authorization: apiToken.value, GUI: 'Case Management' }});

  const items = JSON.parse(data.value).data;

  callback(items);
}

/**
 * @typedef {Object} DefaultActionModal
 * @property {boolean} show - Indicates whether the item is shown or not.
 * @property {string} action - Action associated with the item.
 * @property {boolean} isLoading - Indicates whether the item is in a loading state or not.
 * @property {Object} data - Data object containing various properties.
 * @property {number} data.id - The ID of the data.
 * @property {number} data.commandType - The type of command associated with the data.
 * @property {string} data.field - The field associated with the data.
 * @property {number} data.reload - The reload state of the data.
 * @property {string} data.payload - The payload associated with the data.
 * @property {string} data.order - The order of the data.
 */

/**
 * @template T
 * @typedef { import('vue').Ref<T> } Ref<T>
 */

export const defaultActionModal = JSON.stringify({
  show: false,
  action: null,
  isLoading: false,
  data: {
    id         : null,
    commandType: null,
    field      : null,
    reload     : 0,
    payload    : null,
    order      : '1',
  }
});


export const ModalAction = Object.freeze({
  AddDataCommand   : 1,
  UpdateDataCommand: 2,
  DeleteDataCommand: 3,
  AddFlowCommand   : 4,
  UpdateFlowCommand: 5,
  DeleteFlowCommand: 6
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

  /** @type { Ref<DefaultActionModal> } */
  const actionModal = ref(JSON.parse(defaultActionModal));

  get('payment-types', (items) => paymentTypes.value = items.map(item => ({ label: item.payment_name, value: item.id })));
  get('frozen-import-file-types', (items) => fileTypes.value = items.map(item => ({ label: item.name, value: item.id, paymentTypeId: item.payment_type_id })));
  get('frozen-import-sheet-types', (items) => sheetTypes.value = items.map(item => ({ label: item.name, value: item.id, fileTypeId: item.frozen_import_file_type_id })));
  get('flow-command-types', (items) => flowCommandTypes.value = items.map(item => ({ label: item.name, value: item.id })));
  get('data-command-types', (items) => dataCommandTypes.value = items.map(item => ({ label: item.name, value: item.id })));
  get('frozen-import-data-commands', (items) => dataCommands.value = items);
  get('frozen-import-flow-commands', (items) => flowCommands.value = items);

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
    hasNewDataCommand
  };
});