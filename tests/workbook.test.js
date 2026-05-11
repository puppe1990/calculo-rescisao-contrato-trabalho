import { describe, expect, it, vi } from 'vitest';
import { parseWorkbookRows } from '../resources/js/core/workbook.js';

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
