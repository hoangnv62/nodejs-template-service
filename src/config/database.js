import pgPromise from 'pg-promise';
import {env} from "#config/env.js";

export const pgp = pgPromise({
    capSQL: true,
    error(err, e) {
        if (e.query) console.error("Truy vấn lỗi: ", e.query);
    }
})
export const db = pgp({
    connectionString: env.DB_URL,
    ssl: {rejectUnauthorized: false},
    max: 5,
    idleTimeoutMillis:30000,
    connectTimeoutMillis:5000,
})

