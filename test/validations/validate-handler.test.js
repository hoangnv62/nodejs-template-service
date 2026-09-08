import test from 'node:test';
import assert from 'node:assert/strict';
import {z} from 'zod';
import {validate} from '#validations/validate-handler.js';
import {AppError} from '#exception/errors.js';

const bodySchema = z.object({email: z.string(), age: z.coerce.number()});

test('body hợp lệ thì gọi next không kèm lỗi và ghi lại dữ liệu đã parse', () => {
    const req = {body: {email: 'a@b.com', age: '30'}};
    let nextArg = 'chưa gọi';
    validate({body: bodySchema})(req, {}, arg => { nextArg = arg; });
    assert.equal(nextArg, undefined);
    assert.equal(req.body.age, 30, 'age phải được coerce thành number');
    assert.equal(req.body.email, 'a@b.com');
});

test('body sai thì next nhận BadRequestError 400', () => {
    const req = {body: {}};
    let err = null;
    validate({body: bodySchema})(req, {}, e => { err = e; });
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 400);
    assert.equal(err.error, 'BAD_REQUEST');
});

test('message lỗi liệt kê từng field dạng "path: message"', () => {
    const req = {body: {}};
    let err = null;
    validate({body: bodySchema})(req, {}, e => { err = e; });
    assert.ok(Array.isArray(err.message), 'message hiện là array, không phải string');
    assert.equal(err.message.length, 2);
    assert.ok(err.message.every(m => /^(email|age): /.test(m)), err.message.join(' | '));
});

test('validate query hoạt động độc lập với body', () => {
    const querySchema = z.object({page: z.coerce.number()});
    const req = {query: {page: '2'}};
    let nextArg = 'chưa gọi';
    validate({query: querySchema})(req, {}, arg => { nextArg = arg; });
    assert.equal(nextArg, undefined);
    assert.equal(req.query.page, 2);
});

test('không truyền schema nào thì cho đi qua', () => {
    let nextArg = 'chưa gọi';
    validate()({}, {}, arg => { nextArg = arg; });
    assert.equal(nextArg, undefined);
});

test('validate params: hợp lệ thì coerce, sai thì báo lỗi 400', () => {
    const paramsSchema = z.object({id: z.coerce.number()});
    const ok = {params: {id: '42'}};
    let nextArg = 'chưa gọi';
    validate({params: paramsSchema})(ok, {}, arg => { nextArg = arg; });
    assert.equal(nextArg, undefined);
    assert.equal(ok.params.id, 42);

    const bad = {params: {id: 'abc'}};
    let err = null;
    validate({params: paramsSchema})(bad, {}, e => { err = e; });
    assert.ok(err instanceof AppError);
    assert.equal(err.statusCode, 400);
});
