import 'dotenv/config.js'

const required = (name) => {
    const value = process.env[name];
    if (!value) throw new Error(`Thiếu biến môi trường bắt buộc: ${name}`);
    return value;
}

export const env = {
    PORT: process.env.PORT,
    NODE_ENV: process.env.NODE_ENV || 'dev',
    DB_URL: process.env.DB_URL,
    DB_HOST: process.env.DB_HOST || 'localhost',
    DB_PORT: parseInt(process.env.DB_PORT) || 3306,
    DB_USER: process.env.DB_USER || 'root',
    DB_PASSWORD: process.env.DB_PASSWORD || '',
    DB_NAME: process.env.DB_NAME || 'math_learning',
    JWT_BASE64_SECRET: required('SECRET_KEY'),
    ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '1h',
    REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '24h',

}
