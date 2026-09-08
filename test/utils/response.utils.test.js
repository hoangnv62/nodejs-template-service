import test from 'node:test';
import assert from 'node:assert/strict';
import {success, created, successMsg} from '#utils/response.utils.js';

const fakeRes = () => {
    const res = {statusCode: null, body: undefined};
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => { res.body = body; return res; };
    return res;
};

test('success trả 200 kèm data', () => {
    const res = fakeRes();
    success(res, {symbol: 'FPT'});
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {symbol: 'FPT'});
});

test('success không có data thì dùng body mặc định', () => {
    const res = fakeRes();
    success(res, null);
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {result: 'Thành công'});
});

test('created trả 201', () => {
    const res = fakeRes();
    created(res, {id: 7});
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {id: 7});
});

test('successMsg bọc message vào object', () => {
    const res = fakeRes();
    successMsg(res, 'Đã xoá');
    assert.equal(res.statusCode, 200);
    assert.deepEqual(res.body, {message: 'Đã xoá'});
});

test('created không có data thì dùng body mặc định', () => {
    const res = fakeRes();
    created(res, null);
    assert.equal(res.statusCode, 201);
    assert.deepEqual(res.body, {result: 'Created'});
});
