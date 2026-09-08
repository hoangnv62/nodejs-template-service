import test from 'node:test';
import assert from 'node:assert/strict';
import {
    AppError, NotFoundError, ConflictError,
    ForbiddenError, UnauthorizedError, BadRequestError,
} from '#exception/errors.js';

test('AppError mặc định là 500', () => {
    const err = new AppError();
    assert.equal(err.statusCode, 500);
    assert.equal(err.error, 'INTERNAL_SERVER_ERROR');
    assert.ok(err instanceof Error);
});

test('mỗi subclass map đúng status code và error code', () => {
    const cases = [
        [new BadRequestError(), 400, 'BAD_REQUEST'],
        [new UnauthorizedError(), 401, 'UNAUTHORIZED'],
        [new ForbiddenError(), 403, 'FORBIDDEN'],
        [new NotFoundError(), 404, 'ENTITY_NOT_FOUND'],
        [new ConflictError(), 409, 'CONFLICT'],
    ];
    for (const [err, statusCode, errorCode] of cases) {
        assert.equal(err.statusCode, statusCode, `${errorCode} sai statusCode`);
        assert.equal(err.error, errorCode);
        assert.ok(err instanceof AppError, `${errorCode} phải là AppError`);
    }
});

test('message truyền vào được giữ nguyên', () => {
    assert.equal(new NotFoundError('Không tìm thấy mã CK').message, 'Không tìm thấy mã CK');
});

test('không truyền message thì dùng error code làm message', () => {
    assert.equal(new NotFoundError().message, 'ENTITY_NOT_FOUND');
});
