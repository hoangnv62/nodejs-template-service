# Kiến trúc & luồng request

Rule này load ngay đầu session (không có `paths:`) vì áp dụng cho mọi thay đổi trong `src/`.

## Luồng một request

```
app.js
  └── src/routes/<domain>.route.js
        ├── validate({ body|params|query })      ← #validations/validate-handler.js
        ├── authenticate                          ← #middlewares/auth.middleware.js (route cần token)
        └── asyncHandler(controller)              ← #middlewares/async-handler.middleware.js
              └── src/controllers/<domain>.controller.js
                    └── src/services/<domain>.service.js
                          └── src/repositories/<domain>.repository.js
                                └── db (pg-promise, #config/database.js)
```

Lỗi ở bất kỳ lớp nào đều rơi về `errorHandler` được `app.use` cuối cùng trong `app.js`.

## Trách nhiệm từng lớp

| Lớp | Được làm | Không được làm |
|---|---|---|
| route | khai path, ghép middleware | logic, gọi repository |
| controller | đọc `req`, gọi service, trả response helper | SQL, business rule, try/catch |
| service | business logic, throw AppError, orchestrate nhiều repository | truy cập `req`/`res`, viết SQL |
| repository | SQL qua pg-promise | business rule, throw lỗi HTTP-specific ngoài NotFound |

Controller nhận `req`/`res`; service thì không — truyền dữ liệu đã bóc tách xuống service.

## Thêm một domain mới

Tạo đủ 5 file, đúng thứ tự, đặt tên theo domain:

1. `src/validations/schema/<domain>.schema.js` — zod schema
2. `src/validations/<domain>.validation.js` — ghép schema thành middleware `validate({...})`
3. `src/repositories/<domain>.repository.js` — SQL
4. `src/services/<domain>.service.js` — logic
5. `src/controllers/<domain>.controller.js` — mỏng
6. `src/routes/<domain>.route.js` — `export default router`

Rồi mount trong `app.js`: `app.use(`${API_PREFIX}/<domain>`, <domain>Route)`.

## Import

Chỉ dùng subpath alias (`#services/...`) kèm đuôi `.js`. Đường dẫn tương đối chỉ được
dùng trong cùng một thư mục, như `#exception/error-handler.js` import `./errors.js`.
