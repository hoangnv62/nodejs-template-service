export const apiResponseCode = {
    SUCCESS: {
        code: 200,
        error:'SUCCESS'
    },
    CREATED: {
        code: 201,
        error: 'CREATED',
    },
    INTERNAL_SERVER_ERROR: {
        code: 500,
        error: 'INTERNAL_SERVER_ERROR',
    },
    BAD_REQUEST: {
        code: 400,
        error: 'BAD_REQUEST',
    },
    ENTITY_NOT_FOUND: {
        code: 404,
        error: 'ENTITY_NOT_FOUND',
    },
    RESOURCE_NOT_FOUND: {
        code: 404,
        error: 'RESOURCE_NOT_FOUND',
    },
    UNAUTHORIZED: {
        code: 401,
        error: 'UNAUTHORIZED',
    },
    FORBIDDEN: {
        code: 403,
        error: 'FORBIDDEN',
    },
    METHOD_NOT_ALLOWED: {
        code: 405,
        error: 'METHOD_NOT_ALLOWED',
    },
    CONFLICT: {
        code: 409,
        error: 'CONFLICT',
    }
}