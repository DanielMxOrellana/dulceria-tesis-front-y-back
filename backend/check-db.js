const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool(
    process.env.DATABASE_URL
        ? {
            connectionString: process.env.DATABASE_URL,
            ssl: { rejectUnauthorized: false }
        }
        : {
            host: process.env.PGHOST || "localhost",
            port: Number(process.env.PGPORT || 5432),
            database: process.env.PGDATABASE,
            user: process.env.PGUSER,
            password: process.env.PGPASSWORD,
            ssl: (process.env.PGSSLMODE || "disable") === "require" ? { rejectUnauthorized: false } : false,
        }
);

async function checkSchema() {
    const client = await pool.connect();
    try {
        const res = await client.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'order_complaints'");
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        pool.end();
    }
}
checkSchema();
