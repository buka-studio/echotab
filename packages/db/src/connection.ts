import { Kysely, PostgresDialect } from "kysely";
import { DB } from "kysely-codegen";
import { Pool } from "pg";

export function createConnection() {
  const dialect = new PostgresDialect({
    pool: new Pool({ connectionString: process.env.DATABASE_URL }),
  });

  const conn = new Kysely<DB>({
    dialect,
  });

  return conn;
}

const connection = createConnection();

export { sql } from "kysely";
export default connection;
