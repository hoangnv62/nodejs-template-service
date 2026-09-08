#!/usr/bin/env bash
# Hook: PostToolUse (matcher Edit|Write) — soát file src/ vừa sửa theo quy ước project.
#
# Mục đích: bắt các vi phạm CƠ HỌC của kiến trúc phân lớp ngay lúc file vừa được ghi,
# thay vì đợi tới lúc review hay lúc chạy thật. Đây là mấy lỗi lặp lại nhiều nhất:
# SQL lọt khỏi repository, res.status() trong controller, import tương đối thay vì #alias.
#
# Đây KHÔNG phải review ngữ nghĩa. Lỗi logic (await thiếu, db.one khi có thể 0 dòng,
# edge case) cần agent `code-reviewer` — gọi tay: "dùng code-reviewer review <file>".
#
# Vì sao stderr + exit 2: với PostToolUse, exit 0 thì stdout chỉ vào debug log và
# Claude không thấy. Chỉ exit 2 mới đẩy stderr cho Claude như một cảnh báo.
# Tool đã chạy rồi nên exit 2 ở đây KHÔNG chặn được gì — chỉ để báo, giống
# validate-claude-config.sh. (Cách khác là in JSON có
# hookSpecificOutput.additionalContext rồi exit 0; giữ exit 2 cho nhất quán.)
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_response.filePath // .tool_input.file_path // empty' 2>/dev/null)
[ -z "$file" ] && exit 0

rel=${file#"$PWD/"}

# Test phải nằm trong test/ cùng cấp src/, không nằm cạnh source (CLAUDE.md).
# Báo ngay chỗ đặt sai thay vì bỏ qua im lặng. Phải xét TRƯỚC filter src/*.js.
case "$rel" in
    src/*.test.js)
        echo "[hook] $rel — test đặt sai chỗ: quy ước là test/${rel#src/}" >&2
        exit 2
        ;;
esac

# Chỉ soát source thật trong src/. File trong test/ không soát: test được phép
# dựng fake req/res và gọi res.status(), không phải vi phạm.
case "$rel" in
    src/*.js) ;;
    *) exit 0 ;;
esac
[ -f "$rel" ] || exit 0

# Lớp suy ra từ đường dẫn — quyết định check nào áp dụng.
# schema phải xét TRƯỚC validations/* vì nó là thư mục con.
layer=""
case "$rel" in
    src/controllers/*)        layer=controller ;;
    src/services/*)           layer=service ;;
    src/repositories/*)       layer=repository ;;
    src/routes/*)             layer=route ;;
    src/validations/schema/*) layer=schema ;;
    src/validations/*)        layer=validation ;;
esac

findings=""

# add <line> <message>
add() { findings+="$1|$2"$'\n'; }

# check <message> <extended-regex> — mỗi dòng khớp thành một finding
check() {
    local msg=$1 pat=$2 ln
    while IFS=: read -r ln _; do
        [ -n "$ln" ] && add "$ln" "$msg"
    done < <(grep -nE "$pat" "$rel" 2>/dev/null)
}

# ── Áp dụng cho mọi file trong src/ ──────────────────────────────────────────

# Import tương đối ra ngoài thư mục. Cùng thư mục (./) thì được, theo
# .claude/rules/architecture.md — như error-handler.js import ./errors.js
check 'import tương đối ra ngoài thư mục → dùng subpath alias (#services/..., #utils/...)' \
    "from[[:space:]]*['\"]\.\./"

# Thiếu đuôi .js — ESM bắt buộc. Chỉ xét specifier alias (#) hoặc tương đối (./ ../);
# package ngoài (express, zod) không cần đuôi.
while IFS=: read -r ln _; do
    [ -n "$ln" ] && add "$ln" 'import thiếu đuôi .js — ESM bắt buộc ghi đầy đủ'
done < <(grep -nE "from[[:space:]]*['\"](#|\.{1,2}/)[^'\"]*['\"]" "$rel" 2>/dev/null \
         | grep -vE "\.js['\"]")

# process.env chỉ được đọc trong #config/env.js
if [ "$rel" != "src/config/env.js" ]; then
    check 'process.env rải rác → đọc qua `env` trong #config/env.js' 'process\.env'
fi

# Error trần không có status/mã lỗi → errorHandler trả 500 chung chung
check 'throw new Error() trần → dùng NotFoundError/BadRequestError/... từ #exception/errors.js' \
    'throw new Error\('

# Hardcode status code thay vì apiResponseCode.
# Controller có check res.status() riêng ở dưới, khỏi báo hai lần cùng một dòng.
if [ "$layer" != controller ]; then
    check 'status code hardcode → lấy từ apiResponseCode trong #constants/api-response.constant.js' \
        '\.status\([0-9]{3}\)'
fi

# Tên file phải theo <domain>.<layer>.js
if [ -n "$layer" ]; then
    base=${rel##*/}
    case "$base" in
        *".$layer.js") ;;
        *) add 1 "tên file lệch quy ước — cần <domain>.${layer}.js, đang là ${base}" ;;
    esac
fi

# ── controller ──────────────────────────────────────────────────────────────
if [ "$layer" = controller ]; then
    check 'res.status(...).json(...) trực tiếp → dùng success/created/successMsg từ #utils/response.utils.js' \
        'res\.status\('
    check 'try/catch trong controller → bỏ đi, asyncHandler đẩy lỗi về errorHandler' \
        '^[[:space:]]*try[[:space:]]*\{|\}[[:space:]]*catch[[:space:]]*\('
    check 'truy cập db trong controller → SQL chỉ nằm ở src/repositories/' \
        '\bdb\.(one|oneOrNone|none|any|many|manyOrNone|result|tx|task|batch)\b'
fi

# ── service ─────────────────────────────────────────────────────────────────
if [ "$layer" = service ]; then
    check 'service truy cập req → controller phải bóc dữ liệu ra rồi truyền xuống' \
        '\breq\.'
    check 'service ghi response → đó là việc của controller' \
        '\bres\.(status|json|send)\('
    check 'truy cập db trong service → SQL chỉ nằm ở src/repositories/' \
        '\bdb\.(one|oneOrNone|none|any|many|manyOrNone|result|tx|task|batch)\b'
    check 'SQL trong service → chuyển xuống src/repositories/' \
        '\b(SELECT[[:space:]].*[[:space:]]FROM|INSERT[[:space:]]+INTO|UPDATE[[:space:]].*[[:space:]]SET|DELETE[[:space:]]+FROM)\b'
fi

# ── repository ──────────────────────────────────────────────────────────────
if [ "$layer" = repository ]; then
    # pg-promise dùng $(name); ${...} trong repository gần như luôn là nối chuỗi vào SQL
    check 'nối chuỗi ${...} trong repository → dùng named parameter $(name) của pg-promise' \
        '\$\{'
    # architecture.md: repository chỉ được throw NotFound, lỗi nghiệp vụ khác thuộc service
    check 'repository throw lỗi HTTP khác NotFound → chuyển lên service' \
        'throw new (BadRequest|Conflict|Forbidden|Unauthorized)Error'
fi

# ── route ───────────────────────────────────────────────────────────────────
if [ "$layer" = route ]; then
    # Handler không bọc asyncHandler → lỗi promise không tới errorHandler
    while IFS=: read -r ln _; do
        [ -n "$ln" ] && add "$ln" 'handler chưa bọc asyncHandler → lỗi promise sẽ không tới errorHandler'
    done < <(grep -nE "router\.(get|post|put|patch|delete|all)\(" "$rel" 2>/dev/null \
             | grep -v 'asyncHandler')

    grep -qE '^export default router' "$rel" 2>/dev/null \
        || add 1 'thiếu `export default router` — app.js mount bằng default export'
fi

# ── Báo cáo ─────────────────────────────────────────────────────────────────
[ -z "$findings" ] && exit 0

# Dedup theo CẢ dòng (awk), không dùng `sort -u`: `sort -k1,1n -u` chỉ so key là
# số dòng nên hai finding khác nhau trên cùng một dòng sẽ bị ăn mất một.
# `sort -s` giữ nguyên thứ tự check trong cùng một dòng.
report=$(printf '%s' "$findings" | grep -v '^$' | awk '!seen[$0]++' \
         | sort -t'|' -k1,1n -s | head -20 \
         | awk -F'|' '{printf "  L%-4s %s\n", $1, $2}')
count=$(printf '%s\n' "$report" | grep -c . )

{
    echo "[hook] $rel — $count vi phạm quy ước:"
    printf '%s\n' "$report"
    echo "[hook] Sửa lại cho khớp quy ước, hoặc nói rõ vì sao chỗ này là ngoại lệ."
} >&2
exit 2
