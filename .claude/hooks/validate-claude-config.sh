#!/usr/bin/env bash
# Hook: PostToolUse (matcher Edit|Write) — chạy sau mỗi lần sửa/ghi file.
#
# Mục đích: chặn đúng cái bẫy đã mắc hai lần trong project này — YAML frontmatter
# trong .claude/ sai âm thầm. Ví dụ thật:
#   argument-hint: <method> <path> — ví dụ: GET /x   → dấu ": " làm parse lỗi CẢ frontmatter
#   argument-hint: [a, b]                            → bị đọc thành list, không phải string
# Frontmatter lỗi thì skill mất description và Claude không biết khi nào nên gọi nó,
# mà không có thông báo nào cả.
#
# Vì sao stderr + exit 2: với PostToolUse, exit 0 thì stdout chỉ vào debug log và
# Claude không thấy. Chỉ exit 2 mới đẩy stderr cho Claude như một cảnh báo.
# Tool đã chạy rồi nên exit 2 ở đây KHÔNG chặn được gì — chỉ để báo.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

payload=$(cat)
file=$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$file" ] && exit 0

rel=${file#"$PWD/"}
case "$rel" in
    .claude/*.md|.claude/**/*.md) ;;
    *) exit 0 ;;
esac
[ -f "$rel" ] || exit 0

err=$(python3 - "$rel" <<'PY' 2>&1
import sys, pathlib
try:
    import yaml
except ImportError:
    sys.exit(0)                      # không có PyYAML thì bỏ qua, không làm ồn
text = pathlib.Path(sys.argv[1]).read_text()
if not text.startswith('---\n'):
    sys.exit(0)                      # không có frontmatter là hợp lệ (vd rules luôn nạp)
parts = text.split('\n---\n', 1)
if len(parts) < 2:
    print('frontmatter mở bằng --- nhưng không thấy --- đóng')
    sys.exit(1)
try:
    data = yaml.safe_load(parts[0][4:])
except Exception as e:
    print(f'YAML không parse được: {e}')
    sys.exit(1)
if not isinstance(data, dict):
    print(f'frontmatter phải là mapping, đang là {type(data).__name__}')
    sys.exit(1)
for key in ('description', 'argument-hint', 'name'):
    if key in data and not isinstance(data[key], str):
        got = type(data[key]).__name__
        print(f'`{key}` phải là string, đang là {got} — quote lại giá trị')
        sys.exit(1)
PY
)

if [ -n "$err" ]; then
    echo "[hook] $rel — frontmatter sai: $err" >&2
    exit 2
fi
exit 0
