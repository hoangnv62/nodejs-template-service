import test from 'node:test';
import assert from 'node:assert/strict';
import {errorHandler} from '#exception/error-handler.js';
import {NotFoundError} from '#exception/errors.js';

const fakeRes = (headersSent = false) => {
    const res = {statusCode: null, body: undefined, headersSent};
    res.status = code => { res.statusCode = code; return res; };
    res.json = body => { res.body = body; return res; };
    return res;
};

// Regression: Express chỉ nhận là error middleware khi hàm có ĐỦ 4 tham số.
// Với 3 tham số, app.use(errorHandler) đăng ký nó như middleware thường và
// mọi lỗi rơi về handler mặc định của Express — trả HTML kèm stack trace.
test('errorHandler có đúng 4 tham số để Express nhận là error middleware', () => {
    assert.equal(errorHandler.length, 4);
});

test('AppError được map sang status và shape JSON của project', () => {
    const res = fakeRes();
    errorHandler(new NotFoundError('Không tìm thấy user'), {}, res, () => {
        assert.fail('không được gọi next khi xử lý được lỗi');
    });
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, {
        error: 'ENTITY_NOT_FOUND',
        errorDescription: 'Không tìm thấy user',
    });
});

test('lỗi lạ thành 500 và không lộ message nội bộ', () => {
    const res = fakeRes();
    const original = console.error;
    console.error = () => {};
    try {
        errorHandler(new Error('connect ECONNREFUSED 10.0.0.1:5432'), {}, res, () => {});
    } finally {
        console.error = original;
    }
    assert.equal(res.statusCode, 500);
    assert.equal(res.body.error, 'INTERNAL_SERVER_ERROR');
    assert.equal(res.body.errorDescription, 'Có lỗi sảy ra');
    assert.ok(!JSON.stringify(res.body).includes('ECONNREFUSED'));
});

test('response đã gửi rồi thì nhường cho handler mặc định', () => {
    const res = fakeRes(true);
    const err = new NotFoundError();
    let passed = null;
    errorHandler(err, {}, res, e => { passed = e; });
    assert.equal(passed, err);
    assert.equal(res.body, undefined, 'không được ghi response lần hai');
});
