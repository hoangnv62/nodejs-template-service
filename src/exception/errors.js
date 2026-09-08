import {apiResponseCode} from "#constants/api-response.constant.js";

export class AppError extends Error {
    constructor(error = apiResponseCode.INTERNAL_SERVER_ERROR, message) {
        super(message);
        this.message = message;
        this.statusCode = error.code;
        this.error = error.error
        this.name = 'AppError';
    }
}

export class NotFoundError extends AppError {
    constructor(message = apiResponseCode.ENTITY_NOT_FOUND.error) {
        super(apiResponseCode.ENTITY_NOT_FOUND, message);
    }
}

export class ConflictError extends AppError {
    constructor(message = apiResponseCode.CONFLICT.error) {
        super(apiResponseCode.CONFLICT, message);
    }
}

export class ForbiddenError extends AppError {
    constructor(message = apiResponseCode.FORBIDDEN.error) {
        super(apiResponseCode.FORBIDDEN, message);
    }
}

export class UnauthorizedError extends AppError {
    constructor(message = apiResponseCode.UNAUTHORIZED.error) {
        super(apiResponseCode.UNAUTHORIZED, message);
    }
}

export class BadRequestError extends AppError {
    constructor(message = apiResponseCode.BAD_REQUEST.error) {
        super(apiResponseCode.BAD_REQUEST, message);
    }
}
