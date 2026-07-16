const { Pool } = require("pg");

function getEnv(name, fallback = "") {
  return process.env[name] || fallback;
}

const sslConfig = getEnv("PGSSLMODE", "disable") === "require"
  ? { rejectUnauthorized: false }
  : false;

const databaseUrl = getEnv("DATABASE_URL", "").trim();

const poolResilienceConfig = {
  keepAlive: true,
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 10,
};

const pool = databaseUrl
  ? new Pool({
    connectionString: databaseUrl,
    ssl: sslConfig,
    ...poolResilienceConfig,
  })
  : new Pool({
    host: getEnv("PGHOST", "localhost"),
    port: Number(getEnv("PGPORT", "5432")),
    database: getEnv("PGDATABASE", "dulceria"),
    user: getEnv("PGUSER", "postgres"),
    password: getEnv("PGPASSWORD", "postgres"),
    ssl: sslConfig,
    ...poolResilienceConfig,
  });

// Sin este manejador, un reset de conexion inactiva del lado del servidor
// (comun en el pooler de Supabase) emite un 'error' no capturado en el Pool
// y tumba el proceso de Node entero.
pool.on("error", (err) => {
  console.error("Error inesperado en el pool de PostgreSQL:", err.message);
});

function toPgSql(sql = "") {
  let i = 0;
  return sql.replace(/\?/g, () => {
    i += 1;
    return `$${i}`;
  });
}

function normalizeRows(rows = []) {
  return rows.map((row) => {
    const normalized = {};
    for (const [key, value] of Object.entries(row)) {
      normalized[key] = value;
      normalized[key.toUpperCase()] = value;
    }
    return normalized;
  });
}

async function query(connection, sql, params = []) {
  const pgSql = toPgSql(sql);
  try {
    const result = await connection.query(pgSql, params);
    return normalizeRows(result.rows || []);
  } catch (error) {
    console.error("DATABASE ERROR:", error.message);
    console.error("SQL:", pgSql);
    console.error("PARAMS:", params);
    throw error;
  }
}

async function withConnection(callback) {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

async function withTransaction(callback) {
  return withConnection(async (conn) => {
    await conn.query("BEGIN");
    try {
      const result = await callback(conn);
      await conn.query("COMMIT");
      return result;
    } catch (error) {
      await conn.query("ROLLBACK");
      throw error;
    }
  });
}

module.exports = {
  pool,
  withConnection,
  withTransaction,
  query,
};