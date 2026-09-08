import test from 'node:test';
import assert from 'node:assert/strict';
import {paginated} from '#utils/common.utils.js';

test('paginated trả về đủ metadata phân trang', () => {
    const result = paginated(['a', 'b'], 2, 10, 25);
    assert.deepEqual(result, {
        data: ['a', 'b'],
        currentPage: 2,
        size: 10,
        totalElements: 25,
        totalPages: 3,
    });
});

test('paginated làm tròn lên số trang', () => {
    assert.equal(paginated([], 1, 10, 21).totalPages, 3);
    assert.equal(paginated([], 1, 10, 20).totalPages, 2);
    assert.equal(paginated([], 1, 10, 1).totalPages, 1);
});

test('paginated với danh sách rỗng thì totalPages là 0', () => {
    assert.equal(paginated([], 1, 10, 0).totalPages, 0);
});
