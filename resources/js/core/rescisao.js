import {
  completedYearsBetween,
  countEligibleMonths,
  getCurrentAcquisitionPeriodStart,
  parseISODate,
} from './date.js';
import { roundCurrency } from './money.js';

export const TERMINATION_TYPES = {
  SEM_JUSTA_CAUSA: 'Sem justa causa',
  PEDIDO_DEMISSAO: 'Pedido de demissao',
  TERMINO_CONTRATO: 'Termino de contrato',
};

function validateInput(input) {
  if (!input.employeeName?.trim()) {
    throw new Error('Nome do colaborador e obrigatorio.');
  }

  if (!input.admissionDate || !input.terminationDate) {
    throw new Error('Datas de admissao e desligamento sao obrigatorias.');
  }

  if (Number(input.salary) <= 0) {
    throw new Error('Salario bruto deve ser maior que zero.');
  }

  if (parseISODate(input.terminationDate) < parseISODate(input.admissionDate)) {
    throw new Error('Data de desligamento nao pode ser anterior a admissao.');
  }
}

export function calculateNoticeDays(admissionDate, terminationDate) {
  const completedYears = completedYearsBetween(admissionDate, terminationDate);
  return Math.min(90, 30 + Math.max(0, completedYears - 1) * 3);
}

export function calculateTermination(input) {
  validateInput(input);

  const salary = Number(input.salary);
  const fgtsBalance = Number(input.fgtsBalance || 0);
  const otherDiscounts = Number(input.otherDiscounts || 0);
  const vacationDaysDue = Number(input.vacationDaysDue || 0);

  const admissionDate = parseISODate(input.admissionDate);
  const terminationDate = parseISODate(input.terminationDate);
  const startOfYear = new Date(
    Date.UTC(terminationDate.getUTCFullYear(), 0, 1),
  );
  const thirteenthStart =
    admissionDate > startOfYear ? admissionDate : startOfYear;
  const currentAcquisitionStart = getCurrentAcquisitionPeriodStart(
    admissionDate,
    terminationDate,
  );

  const proportional13Months = countEligibleMonths(
    thirteenthStart,
    terminationDate,
  );
  const proportionalVacationMonths = countEligibleMonths(
    currentAcquisitionStart,
    terminationDate,
  );
  const noticeDays = calculateNoticeDays(admissionDate, terminationDate);

  const salaryBalance = roundCurrency(
    (salary / 30) * terminationDate.getUTCDate(),
  );
  const thirteenthProportional = roundCurrency(
    (salary / 12) * proportional13Months,
  );
  const proportionalVacation = roundCurrency(
    (salary / 12) * proportionalVacationMonths,
  );
  const vacationBonus = roundCurrency(proportionalVacation / 3);
  const dueVacation = roundCurrency((salary / 30) * vacationDaysDue);
  const dueVacationBonus = roundCurrency(dueVacation / 3);

  let noticePay = 0;
  let noticeDiscount = 0;
  if (
    input.terminationType === 'SEM_JUSTA_CAUSA' &&
    input.noticeMode === 'INDENIZADO'
  ) {
    noticePay = roundCurrency((salary / 30) * noticeDays);
  }
  if (
    input.terminationType === 'PEDIDO_DEMISSAO' &&
    input.noticeMode === 'INDENIZADO'
  ) {
    noticeDiscount = roundCurrency(salary);
  }

  const fgtsBase = salaryBalance + thirteenthProportional + noticePay;
  const fgtsDeposit = roundCurrency(fgtsBase * 0.08);
  const fgtsPenalty =
    input.terminationType === 'SEM_JUSTA_CAUSA'
      ? roundCurrency((fgtsBalance + fgtsDeposit) * 0.4)
      : 0;

  const earnings = [
    ['Saldo de salario', salaryBalance],
    ['13o proporcional', thirteenthProportional],
    ['Ferias proporcionais', proportionalVacation],
    ['1/3 ferias proporcionais', vacationBonus],
    ['Ferias vencidas', dueVacation],
    ['1/3 ferias vencidas', dueVacationBonus],
    ['Aviso previo indenizado', noticePay],
    ['Deposito FGTS rescisorio', fgtsDeposit],
    ['Multa de 40% FGTS', fgtsPenalty],
  ].filter(([, value]) => value > 0);

  const discounts = [
    ['Desconto de aviso previo', noticeDiscount],
    ['Outros descontos', roundCurrency(otherDiscounts)],
  ].filter(([, value]) => value > 0);

  const grossTotal = roundCurrency(
    earnings.reduce((sum, [, value]) => sum + value, 0),
  );
  const discountTotal = roundCurrency(
    discounts.reduce((sum, [, value]) => sum + value, 0),
  );
  const netTotal = roundCurrency(grossTotal - discountTotal);

  return {
    input: {
      ...input,
      salary,
      fgtsBalance,
      otherDiscounts,
      vacationDaysDue,
    },
    metrics: {
      noticeDays,
      proportional13Months,
      proportionalVacationMonths,
      grossTotal,
      discountTotal,
      netTotal,
    },
    earnings,
    discounts,
  };
}
