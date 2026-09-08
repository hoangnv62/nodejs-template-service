import test from 'node:test';
import assert from 'node:assert/strict';
import {asyncHandler} from '#middlewares/async-handler.middleware.js';

test('handler thành công thì không gọi next', async () => {
    let nextCalled = false;
    const wrapped = asyncHandler(async () => 'ok');
    await wrapped({}, {}, () => { nextCalled = true; });
    assert.equal(nextCalled, false);
});

test('promise bị reject thì đẩy lỗi sang next', async () => {
    const boom = new Error('boom');
    let passed = null;
    const wrapped = asyncHandler(async () => { throw boom; });
    await wrapped({}, {}, e => { passed = e; });
    assert.equal(passed, boom);
});

test('truyền đúng req, res, next xuống handler', async () => {
    const req = {id: 1}, res = {id: 2};
    let got = null;
    const wrapped = asyncHandler(async (a, b) => { got = [a, b]; });
    await wrapped(req, res, () => {});
    assert.equal(got[0], req);
    assert.equal(got[1], res);
});
