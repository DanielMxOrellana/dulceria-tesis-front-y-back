const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || "postgres://dulce_admin:123456@localhost:5432/dulceria_db"
});

async function checkOrder41() {
    try {
        const res = await pool.query("SELECT * FROM orders WHERE id = 41");
        console.log(res.rows[0]);
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
checkOrder41();
