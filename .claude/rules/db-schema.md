---
paths:
  - "src/repositories/**/*.js"
  - "src/services/**/*.js"
  - "src/validations/schema/**/*.js"
  - "src/config/database.js"
---

# Cấu trúc database

PostgreSQL, truy cập qua pg-promise.

## Nguồn sự thật: `db/schema.sql`

**Dump DDL đầy đủ nằm ở `db/schema.sql`.** Trước khi viết bất kỳ SQL nào —
`SELECT`, `INSERT`, `JOIN`, hay thêm cột vào zod schema — **đọc file đó** để lấy
đúng tên cột, kiểu, constraint và index. Đừng suy ra cấu trúc bảng từ các query có sẵn
trong `repositories/`: query hiện tại có chỗ sai, và không query nào chứa đủ thông tin
về nullability, default hay index.

File này (`db-schema.md`) chỉ chứa **quy ước** và **bản tóm tắt để đọc nhanh**.
Khi hai file lệch nhau thì `db/schema.sql` đúng.

---

## Quy ước chung

**Identifier viết hoa bị PostgreSQL hạ thành chữ thường.** Code viết `u.fullName` trong SQL
không có dấu ngoặc kép, nên PostgreSQL đọc thành `fullname`. Query chạy được **chỉ vì** cột
thật tên là `fullname`. Nếu ai tạo cột bằng `"fullName"` (có ngoặc kép) thì mọi query hiện
tại sẽ vỡ. Quy tắc: **đặt tên cột snake_case, không bao giờ quote identifier.**

**Soft delete qua cột `status`**, không `DELETE`. Mọi query đọc phải kèm `AND status = 1`.
Giá trị lấy từ `COMMON_STATUS` trong `#constants/common.constants.js`:

| Giá trị | Nghĩa |
|---|---|
| `1` | ACTIVE |
| `-1` | INACTIVE |
| `-3` | DELETED |

**Tham số SQL dùng named parameter `$(name)`**, không nối chuỗi, không `$1` theo vị trí.
Chi tiết cách chọn `db.one` / `oneOrNone` / `any` / `none` / `tx`: xem `database.md`.

---

## Tóm tắt bảng

> Chưa dán dump. Phần dưới **suy ra từ SQL trong code**, chỉ để tham khảo tạm —
> sẽ được thay bằng tóm tắt sinh từ `db/schema.sql` sau khi bạn dán.

**`users`** — `id`, `email`, `fullname`, `password` (bcrypt), `role` (int), `status` (int).
Chưa biết: kiểu của `id`, nullability, default, unique, index, FK.

## Mẫu tóm tắt cho bảng mới

Khi thêm bảng, chép mẫu này vào mục trên:

```markdown
## Bảng `<tên>`

| Cột | Kiểu | Ghi chú |
|---|---|---|
| `id` | serial | PK |
| `...` | ... | ... |
| `status` | int | soft delete |

Quan hệ: `<tên>.user_id` → `users.id` (FK, ON DELETE ?)
Index: `...`
```

Ghi cả **quan hệ** và **index** — không có hai thứ đó thì Claude sẽ viết JOIN sai hướng
hoặc query không dùng được index.

---

## Giữ file này khỏi lạc hậu

Mỗi lần đổi schema, dán lại dump vào `db/schema.sql`. Vì nó là SQL thật nên
`git diff` cho thấy rõ cột nào thêm/đổi — dễ soát hơn văn bản viết tay.

`pg_dump` chưa được cài trên máy này. Lấy dump bằng GUI (DataGrip / pgAdmin / DBeaver)
cũng được — hướng dẫn ở đầu `db/schema.sql`. Hoặc cài `postgresql-client` để dùng:

```bash
pg_dump --schema-only --no-owner --no-privileges "$DB_URL" > db/schema.sql
```

Nếu schema nhỏ (dưới ~150 dòng DDL) thì có thể dán thẳng vào file này trong một khối
` ```sql ` thay vì tách ra `db/schema.sql` — đổi lấy việc nó luôn nằm sẵn trong context,
không cần thêm một bước đọc file.

---

## Lưu ý về thời điểm rule này được nạp

Rule có `paths:` chỉ nạp khi Claude **đọc** file khớp glob. Khi tạo một domain hoàn toàn
mới, file repository chưa tồn tại nên rule có thể chưa vào context ngay — Claude thường
đọc một repository có sẵn làm mẫu nên vẫn kích hoạt, nhưng không chắc 100%.

Vì vậy `CLAUDE.md` có một dòng trỏ tới file này, để Claude luôn biết nó tồn tại.
Nếu thấy Claude viết SQL mà không tham chiếu schema, nhắc thẳng: "đọc
`.claude/rules/db-schema.md` trước".
