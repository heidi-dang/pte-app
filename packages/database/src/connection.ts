import postgres from 'postgres';

export interface DatabaseConfig {
  readonly host: string;
  readonly port: number;
  readonly database: string;
  readonly user: string;
  readonly password: string;
  readonly max?: number;
  readonly ssl?: boolean | 'require' | 'prefer';
}

let sql: postgres.Sql | null = null;

export function createConnection(config: DatabaseConfig): postgres.Sql {
  if (sql) {
    throw new Error('Database connection already created. Use getConnection() to reuse.');
  }
  sql = postgres({
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.user,
    password: config.password,
    max: config.max ?? 10,
    ssl: config.ssl ?? false,
    connection: {
      application_name: 'pte-app',
    },
  });
  return sql;
}

export function getConnection(): postgres.Sql {
  if (!sql) {
    throw new Error('Database not connected. Call createConnection() first.');
  }
  return sql;
}

export async function closeConnection(): Promise<void> {
  if (sql) {
    await sql.end({ timeout: 5 });
    sql = null;
  }
}

export async function healthCheck(): Promise<boolean> {
  try {
    const conn = getConnection();
    await conn`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
