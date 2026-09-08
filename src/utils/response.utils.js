import {apiResponseCode} from "#constants/api-response.constant.js";

export const success = (res, data) =>
    res.status(apiResponseCode.SUCCESS.code).json(data || {result: 'Thành công'});

export const created = (res, data, message = 'Created') =>
    res.status(201).json(data || {result: 'Created'});

export const successMsg = (res, message) =>
    res.status(apiResponseCode.SUCCESS.code).json({message});
