---
description: Liệt kê toàn bộ route đang mount và soát các thiếu sót thường gặp
---

## Route hiện có

!`grep -rn "router\.\(get\|post\|put\|patch\|delete\)" src/routes`

## Mount trong app.js

!`grep -n "app.use\|app.get" app.js`

Dựng bảng: method | full path (kèm prefix `/stock-view/api`) | controller | có `authenticate`? | có `validate`?

Sau đó chỉ ra:
- handler async nào thiếu `asyncHandler`
- route nào nhận body/param mà thiếu `validate`
- route nào trả dữ liệu riêng của user mà thiếu `authenticate`
