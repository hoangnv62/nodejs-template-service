---
description: Sửa một bug theo mô tả hoặc file:line, đặt thay đổi vào đúng lớp và verify bằng cách chạy thật
argument-hint: "<mô tả bug hoặc file:line>"
---

## Bug cần sửa

$ARGUMENTS

## Cấu trúc để định vị

!`ls src/routes src/controllers src/services src/repositories src/validations`

## Cách làm

1. **Định vị lớp** — bug thuộc đâu? route (ghép middleware sai, thiếu `asyncHandler`) ·
   validation (schema) · controller (đọc `req` sai) · service (logic) · repository (SQL) ·
   exception (shape lỗi)
2. Đọc một file cùng lớp đã có để bám quy ước trước khi sửa
3. Sửa **ở lớp đúng** — đừng nhét logic vào controller cho nhanh
4. `node --check <file>` từng file vừa sửa
5. Nếu bug nằm trên đường request: nhờ tôi chạy `npm run dev` (đừng tự khởi động server),
   rồi `curl` tái hiện và dán response trước/sau

Báo lại `file:line` đã sửa, nguyên nhân gốc, và bằng chứng đã verify.
Nếu bug hoá ra nằm ở lớp khác với nơi nó biểu hiện, nói rõ điều đó.
