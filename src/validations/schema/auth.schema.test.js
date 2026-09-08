import test from 'node:test';
import assert from 'node:assert/strict';
import {changePasswordSchema, loginSchema, registerSchema} from '#validations/schema/auth.schema.js';

// Regression: refine cũ so sánh currentPassword với CHÍNH NÓ nên luôn false,
// khiến mọi lần đổi mật khẩu đều bị từ chối dù nhập đúng.
test('changePassword: mật khẩu mới khác mật khẩu cũ thì hợp lệ', () => {
    const r = changePasswordSchema.safeParse({currentPassword: 'oldpass1', newPassword: 'newpass1'});
    assert.equal(r.success, true, r.success ? '' : JSON.stringify(r.error.issues));
});

test('changePassword: mật khẩu mới trùng mật khẩu cũ thì bị từ chối', () => {
    const r = changePasswordSchema.safeParse({currentPassword: 'samepass', newPassword: 'samepass'});
    assert.equal(r.success, false);
    assert.equal(r.error.issues[0].path.join('.'), 'newPassword', 'lỗi phải gắn vào field newPassword');
});

test('changePassword: mật khẩu dưới 6 ký tự bị từ chối', () => {
    assert.equal(changePasswordSchema.safeParse({currentPassword: 'old1', newPassword: 'newpass1'}).success, false);
    assert.equal(changePasswordSchema.safeParse({currentPassword: 'oldpass1', newPassword: 'new1'}).success, false);
});

test('login yêu cầu cả email và password', () => {
    assert.equal(loginSchema.safeParse({email: 'a@b.com', password: 'secret1'}).success, true);
    assert.equal(loginSchema.safeParse({email: 'a@b.com'}).success, false);
    assert.equal(loginSchema.safeParse({password: 'secret1'}).success, false);
});

test('register yêu cầu email, fullName, password', () => {
    assert.equal(registerSchema.safeParse({email: 'a@b.com', fullName: 'Nguyen A', password: 'secret1'}).success, true);
    assert.equal(registerSchema.safeParse({email: 'a@b.com', password: 'secret1'}).success, false);
});
