#!/usr/bin/env bash
# Quét sơ bộ các dấu hiệu rủi ro. Mọi kết quả là GỢI Ý cần mở file xác nhận,
# không phải kết luận — nhiều mục dưới đây có trường hợp hợp lệ.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"

echo "=== [CAO] SQL nối chuỗi / template literal có chèn biến ==="
grep -rnE 'sql\s*=\s*`[^`]*\$\{' src/repositories 2>/dev/null || echo "  không thấy"

echo
echo "=== [CAO] Fallback hardcode cho biến trông giống secret ==="
grep -rnE "process\.env\.[A-Z_]*(SECRET|PASSWORD|CREDENTIAL|PRIVATE)[A-Z_]*\s*\|\|\s*['\"]" src 2>/dev/null \
  || echo "  không thấy"

echo
echo "=== [CAO] jwt.decode thay vì jwt.verify ==="
grep -rn "jwt.decode" src 2>/dev/null || echo "  không thấy"

echo
echo "=== [TRUNG] Cột password trong repository — INSERT/so sánh là hợp lệ, SELECT trả về client thì không ==="
grep -rni "password" src/repositories 2>/dev/null || echo "  không thấy"

echo
echo "=== [THẤP] Route không gắn authenticate — login/refresh/endpoint công khai là đúng ==="
grep -rn "router\.\(get\|post\|put\|patch\|delete\)" src/routes 2>/dev/null \
  | grep -v authenticate || echo "  mọi route đều có authenticate"

echo
echo "=== [THẤP] Mọi biến môi trường có fallback — tự đánh giá cái nào là bí mật ==="
grep -rnE "process\.env\.[A-Za-z_]+\s*\|\|\s*['\"]" src/config 2>/dev/null || echo "  không thấy"
