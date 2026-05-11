import initSqlJs from 'sql.js';
import { describe, expect, it } from 'vitest';
import { createDatabase } from '../resources/js/core/database.js';

describe('RescissionDatabase', () => {
  it('salva e lista simulacoes em SQLite', async () => {
    const repository = await createDatabase({
      initSqlJs: initSqlJs(),
    });

    repository.saveCalculation({
      result: {
        input: {
          employeeName: 'Ana Lima',
          terminationType: 'SEM_JUSTA_CAUSA',
          admissionDate: '2024-01-01',
          terminationDate: '2026-05-10',
        },
        metrics: {
          grossTotal: 5000,
          discountTotal: 200,
          netTotal: 4800,
        },
      },
      source: 'manual',
    });

    const rows = repository.listCalculations();

    expect(rows).toHaveLength(1);
    expect(rows[0].employee_name).toBe('Ana Lima');
    expect(rows[0].net_total).toBe(4800);
  });
});
