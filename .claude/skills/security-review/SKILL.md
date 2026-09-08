---
description: Rà soát code tìm SQL injection, thiếu sót xác thực/phân quyền, lộ secret và rò rỉ dữ liệu người dùng trong API nodejs-template-service
disable-model-invocation: true
argument-hint: "đường dẫn dưới src/ (bỏ trống = toàn bộ src)"
---

## Quét sơ bộ

!`bash ${CLAUDE_SKILL_DIR}/scripts/scan.sh`

## File trong phạm vi

!`find src -name '*.js' | sort`

## Nhiệm vụ

Audit theo `checklist.md` trong thư mục skill này. Nếu `$ARGUMENTS` có giá trị thì chỉ
audit trong phạm vi đường dẫn đó, còn lại bỏ qua.

Kết quả quét sơ bộ ở trên chỉ là gợi ý — **phải mở file đọc để xác nhận** trước khi báo cáo.
Ưu tiên theo thứ tự:

1. **SQL injection** — `src/repositories/`: có chỗ nào nối chuỗi hoặc template literal
   chèn biến vào SQL thay vì dùng `$(name)`?
2. **Authentication / authorization** — route nào thiếu `authenticate` mà lẽ ra phải có?
   Route nào trả dữ liệu của user khác vì lọc theo id trong param thay vì `req.user.userId`?
3. **Secret** — API key, JWT secret, connection string hardcode, kể cả default value
   trong `src/config/env.js`
4. **Rò rỉ dữ liệu** — cột `password` có bị `SELECT` rồi trả về client? Có log token?
5. **Xử lý lỗi** — `errorHandler` có làm lộ stack trace hay message nội bộ ra client?
   Kiểm tra cả arity của nó: Express chỉ nhận là error middleware khi hàm có đủ 4 tham số

Mỗi phát hiện kèm: `file:line`, mức độ (cao/trung/thấp), và một cách sửa cụ thể.
Không báo cáo phát hiện suy đoán mà chưa mở file xác nhận.
