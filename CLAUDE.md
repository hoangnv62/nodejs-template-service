# nodejs-template-service

Template service Express 5, Node.js ESM thuần, không TypeScript.
Các endpoint hiện có (`stocks`, `authenticate`) là code mẫu minh hoạ kiến trúc.

## Commands

- Dev (watch): `npm run dev`
- Start: `npm start`
- Test: `npm test` (test runner built-in của Node, không cần dependency)
- Test watch: `npm run test:watch` · Coverage: `npm run test:coverage`

Server chạy port 3000, mọi route nằm dưới prefix `/nodejs-template/api`.

## Stack

- Node.js ESM (`"type": "module"`) — luôn dùng `import`, không `require`
- Express 5, pg-promise (PostgreSQL), zod (validation), jsonwebtoken, bcryptjs
- `jsconfig.json` bật `checkJs` → JSDoc được type-check, giữ code sạch với editor

## Subpath imports

Import nội bộ **luôn** dùng alias trong `package.json#imports`, không dùng đường dẫn tương đối:

```js
import { success } from "#utils/response.utils.js";   // đúng
import { success } from "../utils/response.utils.js"; // sai
```

Alias có sẵn: `#config/* #constants/* #controllers/* #exception/* #middlewares/*
#repositories/* #routes/* #services/* #utils/* #validations/*`

Phải kèm đuôi `.js` trong mọi import (yêu cầu của ESM).

## Kiến trúc phân lớp

```
route → middleware (validate, authenticate) → controller → service → repository → db
```

- **route**: khai báo path, bọc handler bằng `asyncHandler`, gắn `validate({...})` và `authenticate`
- **controller**: chỉ đọc `req`, gọi service, trả qua helper trong `#utils/response.utils.js`. Không chứa business logic, không truy vấn SQL
- **service**: business logic, throw error từ `#exception/errors.js`
- **repository**: chỗ duy nhất được viết SQL
- **validations/schema/**: zod schema, tách khỏi file validation

## Quy ước

- Named export cho mọi module, trừ `router` trong `src/routes/*` (default export)
- Đặt tên file theo `<domain>.<layer>.js` — ví dụ `stock.controller.js`, `user.repository.js`
- Không bao giờ `res.status(...).json(...)` trực tiếp trong controller — dùng `success`, `created`, `successMsg`
- Không `try/catch` trong controller — `asyncHandler` đẩy lỗi về `errorHandler`
- Lỗi nghiệp vụ: throw `NotFoundError`, `BadRequestError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`. Đừng throw `Error` trần
- Shape lỗi trả về client do `errorHandler` quyết định: `{ error, errorDescription }`
- Message lỗi hướng tới người dùng viết bằng tiếng Việt, khớp với code hiện có
- Biến môi trường chỉ đọc qua `env` trong `#config/env.js`, không `process.env` rải rác
- **Cấu trúc DB: dump DDL đầy đủ ở `db/schema.sql`**, quy ước ở `.claude/rules/db-schema.md`.
  Đọc `db/schema.sql` trước khi viết SQL — đừng suy ra cấu trúc bảng từ query có sẵn
- Test nằm cạnh source: `foo.js` → `foo.test.js`. `node --test` tự tìm theo pattern `*.test.js`
- Test không được phụ thuộc DB hay biến môi trường — inject fake `req`/`res`/`next` thay vì chạy server

## Khi thiếu thông tin

Ba nhóm dưới đây **đừng đoán — hỏi trước khi viết code**:

1. **Schema** — bảng hoặc cột chưa có trong `db/schema.sql`. Đừng suy ra cấu trúc từ
   query có sẵn, đừng tự đặt tên cột
2. **Quyền truy cập** — endpoint là public, của riêng user (lọc theo `req.user.userId`),
   hay chỉ admin (kiểm `role`)? Ba đáp án ra ba đoạn code khác nhau, đoán sai là làm lại
3. **Việc chạm ra ngoài** — kết nối DB thật, gọi API bên thứ ba, ghi vào dữ liệu production

Ngoài ba nhóm đó thì tự quyết và **nói rõ giả định đã dùng**, đừng chặn lại để hỏi.
Mặc định nên chọn: có phân trang qua `paginated()`, query đọc lọc `AND status = 1`,
response qua helper trong `#utils/response.utils.js`.

Làm hết phần không phụ thuộc câu trả lời trước, rồi mới hỏi phần còn lại — đừng dừng
cả task chỉ vì thiếu một chi tiết.
