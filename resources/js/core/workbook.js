const HEADER_ALIASES = {
  employeeName: [
    'nome',
    'colaborador',
    'funcionario',
    'employee',
    'employee_name',
  ],
  salary: ['salario', 'salario bruto', 'salary'],
  admissionDate: ['admissao', 'data admissao', 'admission', 'admission_date'],
  terminationDate: [
    'desligamento',
    'demissao',
    'data desligamento',
    'termination',
    'termination_date',
  ],
  terminationType: ['tipo rescisao', 'rescisao', 'termination_type'],
  noticeMode: ['aviso previo', 'notice', 'notice_mode'],
  vacationDaysDue: [
    'ferias vencidas dias',
    'dias ferias vencidas',
    'vacation_days_due',
  ],
  fgtsBalance: ['saldo fgts', 'fgts', 'fgts_balance'],
  otherDiscounts: ['outros descontos', 'discounts', 'other_discounts'],
  notes: ['observacoes', 'obs', 'notes'],
};

const EXPORT_HEADERS = {
  employeeName: 'Nome do colaborador',
  admissionDate: 'Data de admissão',
  terminationDate: 'Data de desligamento',
  terminationType: 'Tipo de rescisão',
  noticeMode: 'Aviso prévio',
  source: 'Origem',
  salary: 'Salário bruto mensal',
  fgtsBalance: 'Saldo FGTS acumulado',
  otherDiscounts: 'Outros descontos',
  vacationDaysDue: 'Dias de férias vencidas',
  noticeDays: 'Dias de aviso prévio',
  proportional13Months: 'Meses 13º proporcional',
  proportionalVacationMonths: 'Meses férias proporcionais',
  grossTotal: 'Total de proventos',
  discountTotal: 'Total de descontos',
  netTotal: 'Líquido estimado',
  notes: 'Observações',
  createdAt: 'Criado em',
};

function normalizeHeader(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLowerCase();
}

function mapHeaders(headers) {
  const mapped = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    for (const [field, aliases] of Object.entries(HEADER_ALIASES)) {
      if (aliases.includes(normalized)) {
        mapped[field] = header;
      }
    }
  }
  return mapped;
}

function getFirstWorksheet(workbook) {
  const sheetName = workbook.SheetNames[0];
  return workbook.Sheets[sheetName];
}

function parseNumericValue(value) {
  return Number(value || 0);
}

function buildExportRow(record) {
  return {
    [EXPORT_HEADERS.employeeName]: record.payload.employeeName,
    [EXPORT_HEADERS.admissionDate]: record.payload.admissionDate,
    [EXPORT_HEADERS.terminationDate]: record.payload.terminationDate,
    [EXPORT_HEADERS.terminationType]: record.payload.terminationType,
    [EXPORT_HEADERS.noticeMode]: record.payload.noticeMode,
    [EXPORT_HEADERS.source]: record.source,
    [EXPORT_HEADERS.salary]: record.payload.salary,
    [EXPORT_HEADERS.fgtsBalance]: record.payload.fgtsBalance,
    [EXPORT_HEADERS.otherDiscounts]: record.payload.otherDiscounts,
    [EXPORT_HEADERS.vacationDaysDue]: record.payload.vacationDaysDue,
    [EXPORT_HEADERS.noticeDays]: record.result.metrics.noticeDays,
    [EXPORT_HEADERS.proportional13Months]:
      record.result.metrics.proportional13Months,
    [EXPORT_HEADERS.proportionalVacationMonths]:
      record.result.metrics.proportionalVacationMonths,
    [EXPORT_HEADERS.grossTotal]: record.result.metrics.grossTotal,
    [EXPORT_HEADERS.discountTotal]: record.result.metrics.discountTotal,
    [EXPORT_HEADERS.netTotal]: record.result.metrics.netTotal,
    [EXPORT_HEADERS.notes]: record.payload.notes,
    [EXPORT_HEADERS.createdAt]: record.created_at,
  };
}

export function parseWorkbookRows(workbook) {
  const worksheet = getFirstWorksheet(workbook);
  const rows = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (!rows.length) {
    return [];
  }

  const headerMap = mapHeaders(Object.keys(rows[0]));

  return rows.map((row) => ({
    employeeName: row[headerMap.employeeName] || '',
    salary: parseNumericValue(row[headerMap.salary]),
    admissionDate: String(row[headerMap.admissionDate] || ''),
    terminationDate: String(row[headerMap.terminationDate] || ''),
    terminationType: String(
      row[headerMap.terminationType] || 'SEM_JUSTA_CAUSA',
    ),
    noticeMode: String(row[headerMap.noticeMode] || 'INDENIZADO'),
    vacationDaysDue: parseNumericValue(row[headerMap.vacationDaysDue]),
    fgtsBalance: parseNumericValue(row[headerMap.fgtsBalance]),
    otherDiscounts: parseNumericValue(row[headerMap.otherDiscounts]),
    notes: String(row[headerMap.notes] || ''),
  }));
}

export function buildCalculationsWorkbook(records) {
  const rows = records.map(buildExportRow);
  const worksheet = window.XLSX.utils.json_to_sheet(rows);
  const workbook = window.XLSX.utils.book_new();
  window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Historico');
  return workbook;
}
