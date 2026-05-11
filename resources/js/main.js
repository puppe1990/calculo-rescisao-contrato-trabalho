import { calculateTermination, TERMINATION_TYPES } from './core/rescisao.js';
import { formatCurrency } from './core/money.js';
import { createDatabase } from './core/database.js';
import { ensureAppStorageDirectory } from './core/app-storage.js';
import {
  buildCalculationsWorkbook,
  parseWorkbookRows,
} from './core/workbook.js';

const DB_FILE_NAME = 'calculo-rescisao.sqlite';

const form = document.querySelector('#rescission-form');
const calculateButton = document.querySelector('#calculate-button');
const importButton = document.querySelector('#import-button');
const exportButton = document.querySelector('#export-button');
const historyList = document.querySelector('#history-list');
const historyCount = document.querySelector('#history-count');
const grossTotal = document.querySelector('#gross-total');
const discountTotal = document.querySelector('#discount-total');
const netTotal = document.querySelector('#net-total');
const breakdownBody = document.querySelector('#breakdown-body');
const terminationBadge = document.querySelector('#termination-badge');

let repository;
let dbPath;

function getFieldValues() {
  return Object.fromEntries(new FormData(form).entries());
}

function setFieldValues(values) {
  for (const [key, value] of Object.entries(values)) {
    const field = form.elements.namedItem(key);
    if (field) {
      field.value = value;
    }
  }
}

function renderBreakdown(result) {
  const breakdown = [
    ...result.earnings.map(([label, value]) => ({
      label,
      value,
      type: 'earning',
    })),
    ...result.discounts.map(([label, value]) => ({
      label,
      value: -value,
      type: 'discount',
    })),
  ];

  breakdownBody.innerHTML = breakdown
    .map(
      (item) => `
    <tr>
      <td class="px-4 py-3 text-slate-700">${item.label}</td>
      <td class="px-4 py-3 text-right font-semibold ${item.type === 'discount' ? 'text-rose-700' : 'text-slate-900'}">
        ${formatCurrency(item.value)}
      </td>
    </tr>
  `,
    )
    .join('');
}

function renderSummary(result) {
  grossTotal.textContent = formatCurrency(result.metrics.grossTotal);
  discountTotal.textContent = formatCurrency(result.metrics.discountTotal);
  netTotal.textContent = formatCurrency(result.metrics.netTotal);
  terminationBadge.textContent =
    TERMINATION_TYPES[result.input.terminationType];
  renderBreakdown(result);
}

function renderHistory(records) {
  historyCount.textContent = `${records.length} simulações`;

  if (!records.length) {
    historyList.innerHTML = `
      <div class="rounded-3xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">
        Nenhuma simulação salva ainda.
      </div>
    `;
    return;
  }

  historyList.innerHTML = records
    .map(
      (record) => `
    <button
      class="flex w-full items-start justify-between rounded-3xl border border-slate-200 bg-slate-50/80 p-4 text-left transition hover:border-slate-300 hover:bg-white"
      data-history-id="${record.id}"
      type="button"
    >
      <div>
        <p class="font-semibold text-slate-900">${record.employee_name}</p>
        <p class="mt-1 text-sm text-slate-600">
          ${record.admission_date} ate ${record.termination_date} · ${TERMINATION_TYPES[record.termination_type]}
        </p>
      </div>
      <div class="text-right">
        <p class="font-semibold text-emerald-700">${formatCurrency(record.net_total)}</p>
        <p class="mt-1 text-xs uppercase tracking-[0.14em] text-slate-400">${record.source}</p>
      </div>
    </button>
  `,
    )
    .join('');
}

async function persistDatabase() {
  await Neutralino.filesystem.writeBinaryFile(
    dbPath,
    repository.exportBinary().buffer,
  );
}

async function refreshHistory() {
  renderHistory(repository.listCalculations(8));
}

async function handleCalculation(source = 'manual') {
  const result = calculateTermination(getFieldValues());
  renderSummary(result);
  repository.saveCalculation({ result, source });
  await persistDatabase();
  await refreshHistory();
}

async function loadHistoryRecord(recordId) {
  const record = repository.getCalculation(Number(recordId));
  if (!record) {
    return;
  }

  setFieldValues(record.payload);
  renderSummary(record.result);
}

async function importWorkbook() {
  const [selectedPath] = await Neutralino.os.showOpenDialog(
    'Selecione a planilha',
    {
      filters: [
        { name: 'Planilhas', extensions: ['xlsx', 'xls'] },
        { name: 'Todos os arquivos', extensions: ['*'] },
      ],
    },
  );

  if (!selectedPath) {
    return;
  }

  const binary = await Neutralino.filesystem.readBinaryFile(selectedPath);
  const workbook = window.XLSX.read(binary, { type: 'array' });
  const rows = parseWorkbookRows(workbook);

  for (const row of rows) {
    const result = calculateTermination(row);
    repository.saveCalculation({ result, source: 'excel' });
  }

  await persistDatabase();
  await refreshHistory();
  await Neutralino.os.showNotification(
    'Importação concluída',
    `${rows.length} linha(s) processadas.`,
  );
}

function buildExportFileName() {
  const date = new Date().toISOString().slice(0, 10);
  return `historico-rescisoes-${date}.xlsx`;
}

async function saveWorkbookFile(workbook, targetPath) {
  const binary = window.XLSX.write(workbook, {
    bookType: 'xlsx',
    type: 'array',
  });
  await Neutralino.filesystem.writeBinaryFile(targetPath, binary);
}

async function exportWorkbook() {
  const records = repository.listCalculationExports();
  if (!records.length) {
    await Neutralino.os.showMessageBox(
      'Sem dados para exportar',
      'Não há simulações salvas para gerar a planilha.',
      'OK',
      'WARNING',
    );
    return;
  }

  const targetPath = await Neutralino.os.showSaveDialog(
    'Salvar planilha exportada',
    {
      defaultPath: buildExportFileName(),
      filters: [{ name: 'Planilhas Excel', extensions: ['xlsx'] }],
    },
  );

  if (!targetPath) {
    return;
  }

  const workbook = buildCalculationsWorkbook(records);
  await saveWorkbookFile(workbook, targetPath);
  await Neutralino.os.showNotification(
    'Exportação concluída',
    `${records.length} simulação(ões) exportada(s).`,
  );
}

async function buildRepository() {
  const appDataPath = await Neutralino.os.getPath('data');
  const appDir = await ensureAppStorageDirectory({
    filesystem: Neutralino.filesystem,
    appDataPath,
  });
  dbPath = `${appDir}/${DB_FILE_NAME}`;

  let binary;
  try {
    binary = await Neutralino.filesystem.readBinaryFile(dbPath);
  } catch {
    binary = null;
  }

  const initSqlJs = window.initSqlJs({
    locateFile: (file) => `/vendor/${file}`,
  });

  repository = await createDatabase({
    initSqlJs,
    persistedBinary: binary ? new Uint8Array(binary) : null,
  });
}

function registerEvents() {
  calculateButton.addEventListener('click', async () => {
    try {
      await handleCalculation();
    } catch (error) {
      await Neutralino.os.showMessageBox(
        'Erro no cálculo',
        error.message,
        'OK',
        'ERROR',
      );
    }
  });

  importButton.addEventListener('click', async () => {
    try {
      await importWorkbook();
    } catch (error) {
      await Neutralino.os.showMessageBox(
        'Erro na importação',
        error.message,
        'OK',
        'ERROR',
      );
    }
  });

  exportButton.addEventListener('click', async () => {
    try {
      await exportWorkbook();
    } catch (error) {
      await Neutralino.os.showMessageBox(
        'Erro na exportação',
        error.message,
        'OK',
        'ERROR',
      );
    }
  });

  historyList.addEventListener('click', async (event) => {
    const target = event.target.closest('[data-history-id]');
    if (!target) {
      return;
    }

    await loadHistoryRecord(target.dataset.historyId);
  });

  Neutralino.events.on('windowClose', () => {
    Neutralino.app.exit();
  });
}

async function bootstrap() {
  Neutralino.init();
  registerEvents();
  await buildRepository();
  await refreshHistory();

  const today = new Date().toISOString().slice(0, 10);
  setFieldValues({
    admissionDate: '2022-01-10',
    terminationDate: today,
  });
}

bootstrap().catch(async (error) => {
  console.error(error);
  await Neutralino.os.showMessageBox(
    'Falha ao iniciar',
    error.message,
    'OK',
    'ERROR',
  );
});
