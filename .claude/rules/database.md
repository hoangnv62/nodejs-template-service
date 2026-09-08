---
paths:
  - "src/repositories/**/*.js"
  - "src/config/database.js"
---

# Database rules (pg-promise)

## Named parameter

Dùng `$(name)` với object, không nối chuỗi, không template literal chèn biến:

```js
const sql = `SELECT id, email FROM users WHERE email = $(email) AND status = 1`;
return await db.one(sql, { email });
```

`$1, $2` theo vị trí chỉ dùng cho `INSERT` nhiều cột như code hiện có; ưu tiên named khi thêm mới.

## Chọn đúng method

| Method | Khi nào |
|---|---|
| `db.one` | bắt buộc đúng 1 dòng — 0 hoặc >1 sẽ throw |
| `db.oneOrNone` | có thể không có, tự xử lý `null` |
| `db.any` | danh sách, có thể rỗng |
| `db.none` | INSERT/UPDATE/DELETE không cần trả về |
| `db.tx` | nhiều câu lệnh phải atomic |

`db.one` throw lỗi của pg-promise, không phải `NotFoundError`. Nếu muốn 404 sạch cho
client thì dùng `oneOrNone` rồi tự throw `NotFoundError`.

## Quy ước khác

- SQL viết uppercase keyword, alias bảng ngắn (`FROM users u`)
- Soft delete: mọi query đọc phải kèm `AND status = 1`
- Pool cấu hình sẵn `max: 5` trong `#config/database.js` — đừng tạo instance `pgp()` thứ hai
- Không log giá trị cột `password` hay token
