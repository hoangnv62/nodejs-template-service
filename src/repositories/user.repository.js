import {db} from '#config/database.js';
import {NotFoundError} from "#exception/errors.js";

export const findById = async (id) => {
    const sql = `
        SELECT u.id       AS id,
               u.fullName AS name,
               u.email    AS email,
               u.role     AS role,
               u.status   AS status
        FROM users u
        WHERE u.id = $(id)
          AND u.status = 1`
    return await db.one(sql,
        {id});
}

export const findByEmail = async (email) => {
    const sql = `
        SELECT u.id       AS id,
               u.fullName AS name,
               u.email    AS email,
               u.role     AS role,
               u.status   AS status
        FROM users u
        WHERE u.email = $(email)
          AND u.status = 1`
    return await db.one(sql,
        {email});
}

export const insert = async ({email, fullName, password, role, status}) => {
    const sql = `
        INSERT INTO users(email, fullName, password, role, status)
        VALUES ($(email), $(fullName), $(password), $(role), $(status))
        RETURNING id
    `
    const insertedUser = await db.one(sql, {email, fullName, password, role, status});
    return insertedUser.id;
}

export const update = async ({id, email, fullName, role, status}) => {
    const sql = `
        UPDATE users
        SET email    = $(email),
            fullName = $(fullName),
            role     = $(role),
            status   = $(status)
        WHERE id = $(id)
    `
    const affected = await db.result(sql, {id, email, fullName, role, status}, r => r.rowCount);
    if (affected === 0) throw new NotFoundError("User not found");
    return affected;
}

export const insertMany = async (users) => {
    if (!users.length) return;
    const sql = `
        INSERT INTO users(email, fullName, password, role, status)
        SELECT *
        FROM UNNEST($(email)::text[], $(fullName)::text[], $(password)::text[], $(role)::int[],
                    $(status)::int[]) RETURNING id, email
    `

    await db.any(sql, {
        email: users.map(r => r.email),
        fullName: users.map(r => r.fullName),
        password: users.map(r => r.password),
        role: users.map(r => r.role),
        status: users.map(r => r.status),
    })
}

export const search = async (keyword, status) => {
    const sql = `
        SELECT u.id       AS id,
               u.fullName AS name,
               u.email    AS email,
               u.role     AS role,
               u.status   AS status
        FROM users u
        WHERE ($(keyword)::text IS NULL
            OR $(keyword)::text = ''
            OR u.email LIKE CONCAT('%', $(keyword), '%')
            OR u.fullName LIKE CONCAT('%', $(keyword), '%'))
          AND ($(status)::int IS NULL OR u.status = $(status))
    `
    return await db.any(sql, {keyword: keyword, status});
}

