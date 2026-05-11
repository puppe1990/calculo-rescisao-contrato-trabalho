const schemaSql = `
  CREATE TABLE IF NOT EXISTS calculations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    employee_name TEXT NOT NULL,
    termination_type TEXT NOT NULL,
    admission_date TEXT NOT NULL,
    termination_date TEXT NOT NULL,
    gross_total REAL NOT NULL,
    discount_total REAL NOT NULL,
    net_total REAL NOT NULL,
    payload_json TEXT NOT NULL,
    result_json TEXT NOT NULL,
    source TEXT DEFAULT 'manual',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
`;

export class RescissionDatabase {
  constructor(db) {
    this.db = db;
    this.db.run(schemaSql);
  }

  saveCalculation({ result, source = 'manual' }) {
    const statement = this.db.prepare(`
      INSERT INTO calculations (
        employee_name,
        termination_type,
        admission_date,
        termination_date,
        gross_total,
        discount_total,
        net_total,
        payload_json,
        result_json,
        source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    statement.run([
      result.input.employeeName,
      result.input.terminationType,
      result.input.admissionDate,
      result.input.terminationDate,
      result.metrics.grossTotal,
      result.metrics.discountTotal,
      result.metrics.netTotal,
      JSON.stringify(result.input),
      JSON.stringify(result),
      source,
    ]);

    const id = this.db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0];
    return this.getCalculation(id);
  }

  listCalculations(limit = 10) {
    const statement = this.db.prepare(`
      SELECT id, employee_name, termination_type, admission_date, termination_date,
             gross_total, discount_total, net_total, source, created_at
      FROM calculations
      ORDER BY id DESC
      LIMIT ?
    `);

    statement.bind([limit]);
    const rows = [];
    while (statement.step()) {
      rows.push(statement.getAsObject());
    }
    statement.free();
    return rows;
  }

  getCalculation(id) {
    const statement = this.db.prepare(`
      SELECT * FROM calculations WHERE id = ?
    `);
    statement.bind([id]);
    const row = statement.step() ? statement.getAsObject() : null;
    statement.free();

    if (!row) {
      return null;
    }

    return {
      ...row,
      payload: JSON.parse(row.payload_json),
      result: JSON.parse(row.result_json),
    };
  }

  exportBinary() {
    return this.db.export();
  }
}

export async function createDatabase({ initSqlJs, persistedBinary = null }) {
  const SQL = await initSqlJs;
  const db = persistedBinary
    ? new SQL.Database(persistedBinary)
    : new SQL.Database();
  return new RescissionDatabase(db);
}
