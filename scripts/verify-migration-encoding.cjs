const fs = require("node:fs");

const migrationPath =
  "prisma/migrations/20260617000000_add_medicine_master_data_structure/migration.sql";
const bytes = fs.readFileSync(migrationPath);

if (bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
  throw new Error(`${migrationPath} has a UTF-8 BOM`);
}

if (bytes.includes(0)) {
  throw new Error(`${migrationPath} contains NUL bytes`);
}

const sql = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
if (!sql.includes('"primary" BOOLEAN DEFAULT false')) {
  throw new Error(`${migrationPath} does not quote the primary column`);
}

console.log(`${migrationPath}: UTF-8, no BOM, no NUL bytes, primary quoted`);
