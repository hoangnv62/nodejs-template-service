---
description: Tạo một endpoint REST mới qua đủ 6 lớp (schema, validation, repository, service, controller, route) theo đúng kiến trúc nodejs-template-service, rồi mount vào app.js
argument-hint: "<method> <path>, ví dụ GET /stocks/:symbol/history"
---

## Cấu trúc hiện tại

!`ls src/routes src/controllers src/services src/repositories src/validations src/validations/schema`

## Route đã mount

!`grep -n "app.use\|API_PREFIX" app.js`

## Nhiệm vụ

Tạo endpoint: **$ARGUMENTS**

Làm theo đúng thứ tự, đọc một file cùng lớp đã có làm mẫu trước khi viết file mới:

1. **zod schema** trong `src/validations/schema/<domain>.schema.js` — nếu domain đã có file thì thêm vào, đừng tạo file mới
2. **validation middleware** trong `src/validations/<domain>.validation.js`
3. **repository** trong `src/repositories/<domain>.repository.js` — SQL named parameter `$(name)`, kèm `AND status = 1` nếu bảng có soft delete
4. **service** trong `src/services/<domain>.service.js` — throw error từ `#exception/errors.js`
5. **controller** trong `src/controllers/<domain>.controller.js` — mỏng, trả qua `success`/`created`
6. **route** trong `src/routes/<domain>.route.js` — `validate` → `authenticate` (nếu cần) → `asyncHandler`
7. **mount** trong `app.js` nếu domain chưa được mount

Bỏ qua lớp nào không cần thiết (ví dụ endpoint chỉ gọi SDK ngoài thì không cần repository),
nhưng nói rõ vì sao bỏ.

## Kiểm tra cuối

- `node --check` mọi file vừa tạo
- Mọi import dùng subpath alias `#...` kèm đuôi `.js`
- Báo lại đường dẫn từng file đã tạo/sửa và một lệnh `curl` để thử endpoint
