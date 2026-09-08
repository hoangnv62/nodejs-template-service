import {z} from 'zod';

export const loginSchema = z.object({
    email: z.string().min(5, 'Email không được để trống'),
    password: z.string().min(6, 'Mật khẩu không được trống'),
})
export const refreshTokenSchema = z.object({
    refreshToken: z.string().min(5, "Token không hợp lệ")
})
export const registerSchema = z.object({
    email: z.string().min(5, 'Email không được để trống'),
    fullName: z.string().min(5, 'Tên không được để trống'),
    password: z.string().min(6, 'Mật khẩu không được trống'),
})
export const changePasswordSchema = z.object({
    currentPassword: z.string().min(6, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z.string().min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
}).refine(data => data.currentPassword !== data.currentPassword, {
    message: "Mật khẩu mới phải khác mật khẩu hiện tại",
    path: ['newPassword'], //path quyết định lỗi gắn vào field nào. Có nó thì frontend hiện lỗi ngay dưới ô "mật khẩu mới"; bỏ đi thì lỗi thành lỗi cấp form, khó gắn vào input cụ thể.
});
