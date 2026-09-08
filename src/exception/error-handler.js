import {AppError} from "./errors.js";
import {apiResponseCode} from "#constants/api-response.constant.js";

export const errorHandler = (err, req, res, next) => {
    if (res.headersSent) return next(err);
    let statusCode = apiResponseCode.INTERNAL_SERVER_ERROR.code;
    let errorCode = apiResponseCode.INTERNAL_SERVER_ERROR.error;
    let message = 'Có lỗi sảy ra';
    if (err instanceof AppError) {
        statusCode = err.statusCode;
        errorCode = err.error;
        message = err.message;
    } else {
        console.error('Unexpected error: ', err);
    }
    res.status(statusCode).json({
        error: errorCode,
        errorDescription: message,
    });
};