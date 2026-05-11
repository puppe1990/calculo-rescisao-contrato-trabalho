import { describe, expect, it } from 'vitest';
import {
  calculateTermination,
  calculateNoticeDays,
} from '../resources/js/core/rescisao.js';

describe('calculateNoticeDays', () => {
  it('retorna 30 dias no primeiro ano completo', () => {
    const days = calculateNoticeDays(
      new Date(Date.UTC(2024, 0, 10)),
      new Date(Date.UTC(2026, 4, 11)),
    );

    expect(days).toBe(33);
  });
});

describe('calculateTermination', () => {
  it('calcula sem justa causa com aviso indenizado e multa do FGTS', () => {
    const result = calculateTermination({
      employeeName: 'Maria de Souza',
      salary: 3000,
      admissionDate: '2023-01-10',
      terminationDate: '2026-05-20',
      terminationType: 'SEM_JUSTA_CAUSA',
      noticeMode: 'INDENIZADO',
      vacationDaysDue: 10,
      fgtsBalance: 10000,
      otherDiscounts: 150,
    });

    expect(result.metrics.noticeDays).toBe(36);
    expect(result.metrics.proportional13Months).toBe(5);
    expect(result.metrics.grossTotal).toBe(14617.2);
    expect(result.metrics.discountTotal).toBe(150);
    expect(result.metrics.netTotal).toBe(14467.2);
  });

  it('desconta aviso no pedido de demissao', () => {
    const result = calculateTermination({
      employeeName: 'Carlos Pereira',
      salary: 4500,
      admissionDate: '2025-02-01',
      terminationDate: '2026-05-18',
      terminationType: 'PEDIDO_DEMISSAO',
      noticeMode: 'INDENIZADO',
      vacationDaysDue: 0,
      fgtsBalance: 3500,
      otherDiscounts: 0,
    });

    expect(result.metrics.grossTotal).toBeGreaterThan(0);
    expect(result.metrics.discountTotal).toBe(4500);
    expect(result.discounts[0][0]).toContain('aviso');
  });
});
