# Checklist bảo mật — nodejs-template-service

## SQL (src/repositories/)

- [ ] Mọi tham số truyền qua `$(name)` hoặc `$1`, không nối chuỗi
- [ ] Không có `db.query` với SQL build động từ input người dùng
- [ ] Tên cột/bảng động (nếu có) được whitelist, không lấy trực tiếp từ query param
- [ ] `ORDER BY` từ input được map qua allow-list

## Authentication (src/middlewares/auth.middleware.js, src/services/jwt.service.js)

- [ ] Token verify bằng `jwt.verify`, không `jwt.decode`
- [ ] Kiểm tra `TOKEN_TYPES` — access token không được dùng như refresh token và ngược lại
- [ ] Có kiểm tra hạn (`exp`); không tự set `expiresIn` quá dài
- [ ] Secret đọc từ `env`, không có fallback hardcode trong production
- [ ] Bcrypt cost factor >= 10

## Authorization

- [ ] Route trả dữ liệu riêng của user đều lọc theo `req.user.userId`, không theo id trong param
- [ ] Route dành cho admin kiểm tra `role`, không chỉ kiểm tra "đã đăng nhập"

## Dữ liệu trả về

- [ ] Repository không `SELECT` cột `password` trừ khi phục vụ so sánh mật khẩu
- [ ] Response không chứa `password`, token nội bộ, hay id nội bộ không cần thiết
- [ ] Message lỗi login không phân biệt "email không tồn tại" vs "sai mật khẩu"

## Input

- [ ] Mọi route có body/param/query đều đi qua `validate({...})`
- [ ] Schema có `.max()` cho string, chặn payload lớn
- [ ] Giới hạn `express.json({limit})` phù hợp — 50mb hiện tại là rất rộng cho một API JSON

## Config & log

- [ ] `.env` nằm trong `.gitignore` và bị deny trong `.claude/settings.json`
- [ ] `console.error` không in query kèm giá trị mật khẩu (chú ý `error` handler của pg-promise)
- [ ] `ssl.rejectUnauthorized: false` — chỉ chấp nhận nếu DB provider bắt buộc, ghi rõ lý do
