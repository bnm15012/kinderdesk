import "dotenv/config";
import mysql from "mysql2/promise";

const host = process.env.MYSQL_HOST ?? "127.0.0.1";
const port = process.env.MYSQL_PORT ? parseInt(process.env.MYSQL_PORT) : 3306;
const database = process.env.MYSQL_DATABASE ?? "preschool_erp";
const user = process.env.MYSQL_USER ?? "root";
const password = process.env.MYSQL_PASSWORD ?? "";

async function main() {
  const conn = await mysql.createConnection({ host, port, user, password });
  await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${database}\``);
  console.log(`Database "${database}" is ready`);
  await conn.end();
}

main().catch((e) => {
  console.error("Failed to create database:", e.message);
  process.exit(1);
});
