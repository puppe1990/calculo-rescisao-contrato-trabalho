import { copyFile, mkdir } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.cwd();
const vendorDir = path.join(rootDir, 'resources', 'vendor');

const copies = [
  [
    path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.js'),
    path.join(vendorDir, 'sql-wasm.js'),
  ],
  [
    path.join(rootDir, 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
    path.join(vendorDir, 'sql-wasm.wasm'),
  ],
  [
    path.join(rootDir, 'node_modules', 'xlsx', 'dist', 'xlsx.full.min.js'),
    path.join(vendorDir, 'xlsx.full.min.js'),
  ],
];

await mkdir(vendorDir, { recursive: true });
await Promise.all(copies.map(([from, to]) => copyFile(from, to)));

console.log(`Vendor assets synced to ${vendorDir}`);
