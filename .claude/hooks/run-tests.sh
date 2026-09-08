#!/usr/bin/env bash
# Hook: Stop — chạy sau khi Claude kết thúc một lượt trả lời.
#
# Mục đích: mạng an toàn cho refactor. Bạn không phải nhớ nhắc "chạy test đi",
# và Claude không phải tự nhớ — Claude Code chạy script này bất kể Claude quyết định gì.
#
# Vì sao exit 0 chứ không exit 2:
#   exit 0 → stdout được thêm vào context, Claude ĐỌC ĐƯỢC và tự sửa tiếp.
#   exit 2 → chặn Claude dừng lại. Nhưng Stop không có field loop-guard nào được
#            tài liệu ghi nhận, nên exit 2 có nguy cơ lặp vô hạn nếu test không sửa được.
# Muốn đổi sang chế độ chặn thì đọc kỹ mục "Exit code 2 behavior per event" trước.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0

# Không có thay đổi chưa commit trong src/ thì bỏ qua, tránh chạy test mỗi lượt hỏi đáp.
if git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    if [ -z "$(git status --porcelain -- src package.json 2>/dev/null)" ]; then
        exit 0
    fi
fi

out=$(npm test 2>&1)
pass=$(printf '%s\n' "$out" | grep -E '^# pass ' | awk '{print $3}')
fail=$(printf '%s\n' "$out" | grep -E '^# fail ' | awk '{print $3}')
: "${pass:=?}" "${fail:=?}"

if [ "$fail" = "0" ]; then
    echo "[hook] npm test: ${pass}/${pass} pass — thay đổi trong src/ không làm vỡ test nào."
else
    echo "[hook] npm test: ${pass} pass, ${fail} FAIL. Test đỏ sau thay đổi trong src/:"
    printf '%s\n' "$out" | grep -E '^not ok ' | sed 's/^/  /'
    echo "[hook] Sửa cho xanh lại, hoặc nói rõ vì sao thay đổi hành vi là có chủ ý."
fi
exit 0
