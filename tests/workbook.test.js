import { describe, expect, it, vi } from 'vitest';
import {
  buildCalculationsWorkbook,
  parseWorkbookRows,
} from '../resources/js/core/workbook.js';

describe('parseWorkbookRows', () => {
  it('normaliza cabecalhos comuns de planilha em portugues', () => {
    global.window = {
      XLSX: {
        utils: {
          sheet_to_json: vi.fn(() => [
            {
              Nome: 'Maria',
              Salario: '3200',
              Admissao: '2023-02-01',
              Desligamento: '2026-05-10',
              'Tipo Rescisao': 'SEM_JUSTA_CAUSA',
            },
          ]),
        },
      },
    };

    const workbook = {
      SheetNames: ['Rescisoes'],
      Sheets: { Rescisoes: {} },
    };

    const rows = parseWorkbookRows(workbook);

    expect(rows[0].employeeName).toBe('Maria');
    expect(rows[0].salary).toBe(3200);
    expect(rows[0].terminationType).toBe('SEM_JUSTA_CAUSA');
  });
});

describe('buildCalculationsWorkbook', () => {
  it('monta uma planilha com colunas do historico salvo', () => {
    const bookAppendSheet = vi.fn();
    const jsonToSheet = vi.fn(() => ({ A1: { v: 'header' } }));
    const bookNew = vi.fn(() => ({ SheetNames: [], Sheets: {} }));

    global.window = {
      XLSX: {
        utils: {
          json_to_sheet: jsonToSheet,
          book_new: bookNew,
          book_append_sheet: bookAppendSheet,
        },
      },
    };

    const workbook = buildCalculationsWorkbook([
      {
        source: 'manual',
        created_at: '2026-05-11 10:00:00',
        payload: {
          employeeName: 'Ana Lima',
          admissionDate: '2024-01-01',
          terminationDate: '2026-05-10',
          terminationType: 'SEM_JUSTA_CAUSA',
          noticeMode: 'INDENIZADO',
          salary: 5000,
          fgtsBalance: 1000,
          otherDiscounts: 200,
          vacationDaysDue: 10,
          notes: 'Caso teste',
        },
        result: {
          metrics: {
            noticeDays: 33,
            proportional13Months: 5,
            proportionalVacationMonths: 5,
            grossTotal: 7000,
            discountTotal: 200,
            netTotal: 6800,
          },
        },
      },
    ]);

    expect(workbook).toEqual({ SheetNames: [], Sheets: {} });
    expect(jsonToSheet).toHaveBeenCalledWith([
      expect.objectContaining({
        'Nome do colaborador': 'Ana Lima',
        'Tipo de rescisao': 'SEM_JUSTA_CAUSA',
        'Liquido estimado': 6800,
      }),
    ]);
    expect(bookAppendSheet).toHaveBeenCalledWith(
      workbook,
      { A1: { v: 'header' } },
      'Historico',
    );
  });
});
