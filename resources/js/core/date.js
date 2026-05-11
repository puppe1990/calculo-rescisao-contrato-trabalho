export function parseISODate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function formatISODate(date) {
  return date.toISOString().slice(0, 10);
}

export function monthsBetween(startDate, endDate) {
  return (
    (endDate.getUTCFullYear() - startDate.getUTCFullYear()) * 12 +
    (endDate.getUTCMonth() - startDate.getUTCMonth())
  );
}

export function countEligibleMonths(startDate, endDate) {
  if (endDate < startDate) {
    return 0;
  }

  let months =
    monthsBetween(
      new Date(
        Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1),
      ),
      new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1)),
    ) + 1;

  if (startDate.getUTCDate() > 15) {
    months -= 1;
  }

  if (endDate.getUTCDate() < 15) {
    months -= 1;
  }

  return Math.max(0, Math.min(12, months));
}

export function completedYearsBetween(startDate, endDate) {
  let years = endDate.getUTCFullYear() - startDate.getUTCFullYear();
  const anniversary = new Date(
    Date.UTC(
      endDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    ),
  );

  if (anniversary > endDate) {
    years -= 1;
  }

  return Math.max(0, years);
}

export function getCurrentAcquisitionPeriodStart(
  admissionDate,
  terminationDate,
) {
  const candidate = new Date(
    Date.UTC(
      terminationDate.getUTCFullYear(),
      admissionDate.getUTCMonth(),
      admissionDate.getUTCDate(),
    ),
  );

  if (candidate > terminationDate) {
    candidate.setUTCFullYear(candidate.getUTCFullYear() - 1);
  }

  return candidate;
}
