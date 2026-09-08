# stock-view-service

Express 5 REST API cho dữ liệu chứng khoán Việt Nam. Node.js ESM thuần, không TypeScript.

## Commands

- Dev (watch): `npm run dev`
- Start: `npm start`
- Test: chưa có test runner (`npm test` đang là placeholder)

Server chạy port 3000, mọi route nằm dưới prefix `/stock-view/api`.

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
