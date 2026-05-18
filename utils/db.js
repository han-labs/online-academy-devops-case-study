import 'dotenv/config';
import knex from 'knex';

const db = knex({
    client: 'pg',
    connection: {
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT || 5432),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
    },
    pool: { min: 0, max: 15 }
});

if (process.env.NODE_ENV !== 'production') {
    console.log('DB_HOST =', process.env.DB_HOST);
    console.log('DB_PORT =', process.env.DB_PORT);
    console.log('DB_USER =', process.env.DB_USER);

    db.raw('SELECT 1')
        .then(() => console.log('DB connected successfully'))
        .catch(err => console.error('DB connection error:', err));
}

export default db;