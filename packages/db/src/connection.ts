import { Kysely, PostgresDialect } from "kysely";
import { Pool } from "pg";

import { DB } from "./types";

export function createConnection() {
  const db = new Kysely<DB>({
    dialect: new PostgresDialect({
      pool: new Pool({
        host: process.env.DB_HOST,
        database: process.env.DB_NAME,
        password: process.env.DB_PASSWORD,
        user: process.env.DB_USER,
      }),
    }),
  });

  return db;
}

const connection = createConnection();

export { sql } from "kysely";
export default connection;
