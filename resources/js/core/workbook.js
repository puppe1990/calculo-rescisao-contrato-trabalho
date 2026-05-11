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

export function parseWorkbookRows(workbook) {
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const rows = window.XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  if (!rows.length) {
    return [];
  }

  const headerMap = mapHeaders(Object.keys(rows[0]));

  return rows.map((row) => ({
    employeeName: row[headerMap.employeeName] || '',
    salary: Number(row[headerMap.salary] || 0),
    admissionDate: String(row[headerMap.admissionDate] || ''),
    terminationDate: String(row[headerMap.terminationDate] || ''),
    terminationType: String(
      row[headerMap.terminationType] || 'SEM_JUSTA_CAUSA',
    ),
    noticeMode: String(row[headerMap.noticeMode] || 'INDENIZADO'),
    vacationDaysDue: Number(row[headerMap.vacationDaysDue] || 0),
    fgtsBalance: Number(row[headerMap.fgtsBalance] || 0),
    otherDiscounts: Number(row[headerMap.otherDiscounts] || 0),
    notes: String(row[headerMap.notes] || ''),
  }));
}
