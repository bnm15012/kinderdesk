import "dotenv/config";
import mysql from "mysql2/promise";
import fs from "node:fs";

const sql = fs.readFileSync("./scripts/prod-fresh.sql", "utf8");

const conn = await mysql.createConnection({
  host: process.env.MYSQL_HOST,
  port: process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 4000,
  database: process.env.MYSQL_DATABASE,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  multipleStatements: true,
  ssl: { rejectUnauthorized: false },
});

console.log("Connected to prod");
await conn.query(sql);
console.log("Prod tables dropped and recreated");

const [rows] = await conn.query("SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = DATABASE()");
console.log("Tables in prod:", (rows as any[])[0].table_count);

await conn.end();
