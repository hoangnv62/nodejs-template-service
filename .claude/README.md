# Hướng dẫn dùng `.claude/`

Cấu hình Claude Code cho `nodejs-template-service`. File này là tài liệu cho người đọc —
Claude Code **không** nạp nó vào context (chỉ `CLAUDE.md` và `rules/*.md` được nạp tự động),
nên viết dài không tốn token của session.

Tài liệu gốc: https://code.claude.com/docs/en/claude-directory

---

## 1. Tra nhanh

| Đường dẫn | Kích hoạt thế nào | Dùng để |
|---|---|---|
| `settings.json` | luôn luôn, **cưỡng chế** | permission: lệnh nào chạy được, file nào cấm đọc |
| `settings.local.json` | luôn luôn, chỉ máy bạn | override cá nhân, đã gitignore |
| `hooks/run-tests.sh` | tự động khi Claude kết thúc lượt | chạy `npm test` nếu `src/` hoặc `test/` có thay đổi chưa commit |
| `hooks/validate-claude-config.sh` | tự động sau mỗi Edit/Write | chặn YAML frontmatter sai trong `.claude/` |
| `hooks/auto-review.sh` | tự động sau mỗi Edit/Write | soát vi phạm quy ước cơ học trong `src/**/*.js` |
| `rules/architecture.md` | mọi session | trách nhiệm từng lớp, luồng request |
| `rules/api-conventions.md` | khi mở `routes/`, `controllers/`, `validations/`, `app.js` | response helper, thứ tự middleware |
| `rules/database.md` | khi mở `repositories/`, `config/database.js` | `$(name)`, chọn method pg-promise |
| `rules/db-schema.md` | khi mở `repositories/`, `services/`, `validations/schema/` | quy ước DB + trỏ tới `db/schema.sql` |
| `skills/new-endpoint/` | gõ `/new-endpoint`, hoặc Claude tự gọi | tạo endpoint mới qua 6 lớp |
| `skills/security-review/` | gõ `/security-review` (chỉ user gọi được) | audit bảo mật theo checklist |
| `commands/check-routes.md` | gõ `/check-routes` | liệt kê route + soát thiếu sót |
| `commands/fix-bug.md` | gõ `/fix-bug <mô tả>` | sửa bug, đặt đúng lớp, verify |
| `agents/code-reviewer.md` | gõ `@code-reviewer`, hoặc Claude tự delegate | review read-only, context riêng |
| `agents/api-tester.md` | gõ `@api-tester` | gọi HTTP thật, báo cáo status/body |
| `output-styles/review-mode.md` | chọn trong `/config` | đổi format trả lời mọi lượt |
| `workflows.disabled/` | **đang tắt** | xem mục 9 |

---

## 2. Bảy cơ chế khác nhau ở điểm nào

Đây là chỗ dễ lẫn nhất. Phân biệt theo **ai giữ quyền quyết định** và **khi nào vào context**:

| | Vào context khi nào | Có cưỡng chế? | Dùng khi |
|---|---|---|---|
| `settings.json` | không vào context | **Có** — client chặn bất kể Claude nghĩ gì | muốn chắc chắn 100% |
| `hooks/` (khai trong settings) | không vào context | **Có** — chạy bất kể Claude quyết định gì | muốn một việc luôn xảy ra |
| `CLAUDE.md`, `rules/` | mọi session (hoặc khi khớp `paths:`) | Không, chỉ là hướng dẫn | quy ước luôn phải biết |
| `skills/` | chỉ khi được gọi | Không | quy trình nhiều bước, lặp lại |
| `commands/` | chỉ khi bạn gõ `/tên` | Không | prompt một file, gọn |
| `agents/` | chạy ở **context window riêng** | Không (nhưng giới hạn được `tools:`) | task nặng, không muốn bẩn hội thoại chính |
| `output-styles/` | sửa system prompt | Không | đổi giọng/format mọi lượt |

Điểm mấu chốt: **rules và CLAUDE.md là lời khuyên, không phải luật.** Muốn chắc một việc
xảy ra hay không xảy ra thì dùng `permissions` trong `settings.json` hoặc hook — không phải
viết thêm vào rule.

---

## 3. `settings.json` — permission

```json
"allow": ["Bash(npm run *)", "Bash(node --check *)", "Bash(git diff *)", ...]
"deny":  ["Read(.env)", "Read(.env.*)", "Bash(rm -rf *)", "Bash(npm publish *)", ...]
```

Thứ tự đánh giá: **deny → ask → allow**. Deny luôn thắng dù có allow trùng khớp.
Lệnh không nằm trong danh sách nào thì Claude hỏi bạn.

Lưu ý về `Read(.env)`: nó chặn **tool Read**. Một lệnh bash như `cat .env` là rule khác —
nếu muốn chặn kín thì thêm cả `Bash(cat .env*)`, `Bash(grep * .env*)`.

Không ghim `"model"` vào file này: nó commit cho cả team nên sẽ đè lựa chọn model của
mọi người. Muốn ghim cho riêng mình thì đặt trong `settings.local.json`.

---

## 4. `hooks/` — cưỡng chế, không phải lời khuyên

**Không có** thư mục hook nào được Claude Code tự động phát hiện ở cấp project.
Hook **phải** khai trong `settings.json`; `.claude/hooks/` chỉ chứa **script**.
(Riêng plugin thì khác: plugin dùng `hooks/hooks.json`.)

```json
"hooks": {
  "Stop": [
    { "hooks": [{ "type": "command",
                  "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/run-tests.sh",
                  "args": [] }] }
  ],
  "PostToolUse": [
    { "matcher": "Edit|Write",
      "hooks": [{ "type": "command",
                  "command": "${CLAUDE_PROJECT_DIR}/.claude/hooks/validate-claude-config.sh",
                  "args": [] }] }
  ]
}
```

Dùng `${CLAUDE_PROJECT_DIR}` để script tìm được bất kể cwd. Ưu tiên **exec form**
(`command` + `args`) khi đường dẫn có placeholder.

### `auto-review.sh` — soát quy ước ngay lúc file vừa ghi

Chạy trên `PostToolUse` matcher `Edit|Write`, chỉ xét `src/**/*.js`. Bắt các vi phạm
**cơ học** của kiến trúc phân lớp, suy lớp từ đường dẫn file:

| Phạm vi | Soát |
|---|---|
| mọi file `src/` | import `../` ra ngoài thư mục, import thiếu `.js`, `process.env` ngoài `#config/env.js`, `throw new Error()` trần, status code hardcode, tên file lệch `<domain>.<layer>.js` |
| `controllers/` | `res.status()`, `try/catch`, truy cập `db.*` |
| `services/` | `req.`, `res.status/json/send`, `db.*`, SQL literal |
| `repositories/` | nối chuỗi `${...}` vào SQL, throw lỗi HTTP khác NotFound |
| `routes/` | handler chưa bọc `asyncHandler`, thiếu `export default router` |

Thêm vào đó: `*.test.js` nằm trong `src/` bị báo đặt sai chỗ (quy ước là `test/`).

**Đây không phải review ngữ nghĩa.** Lỗi logic — thiếu `await`, `db.one` chỗ có thể 0
dòng, edge case — cần agent `code-reviewer`, phải gọi tay:
`dùng code-reviewer review src/services/foo.service.js`.

Dùng `stderr` + exit 2 giống `validate-claude-config.sh`: với `PostToolUse`, exit 0 thì
stdout chỉ vào debug log, Claude không thấy. Tool đã chạy rồi nên exit 2 ở đây không chặn
được gì — chỉ để báo.

### `run-tests.sh` — mạng an toàn cho refactor

Chạy trên event `Stop`, tức sau khi Claude kết thúc một lượt. Đây là câu trả lời cho
"làm sao chắc chắn refactor không đổi hành vi": Claude Code chạy nó **bất kể Claude
quyết định gì**, nên không phụ thuộc việc Claude có tự nhớ chạy test hay không.

- Bỏ qua nếu `git status` cho thấy `src/`, `test/` và `package.json` không có thay đổi chưa commit
  → không chạy test mỗi lượt hỏi đáp thông thường
- Test xanh: in `[hook] npm test: 25/25 pass`
- Test đỏ: liệt kê từng dòng `not ok` để Claude sửa tiếp

**Luôn exit 0.** Với `Stop`, exit 0 đưa stdout vào context cho Claude đọc được và tự sửa;
exit 2 thì *chặn* Claude dừng lại — nhưng `Stop` không có field loop-guard nào được tài liệu
ghi nhận, nên exit 2 có nguy cơ lặp vô hạn khi test không sửa được. Muốn đổi sang chế độ
chặn thì đọc mục "Exit code 2 behavior per event" trước.

### `validate-claude-config.sh` — chặn bẫy YAML

Chạy trên `PostToolUse` với matcher `Edit|Write`. Chỉ xét file `.md` dưới `.claude/`,
bỏ qua mọi file khác. Bắt ba trường hợp đã xảy ra thật trong project này:

| Trường hợp | Báo lỗi |
|---|---|
| `argument-hint: <a> — ví dụ: X` | `YAML không parse được: mapping values are not allowed here` |
| `argument-hint: [a, b]` | `` `argument-hint` phải là string, đang là list — quote lại giá trị `` |
| mở `---` mà thiếu `---` đóng | `frontmatter mở bằng --- nhưng không thấy --- đóng` |

**Dùng stderr + exit 2.** Với `PostToolUse`, exit 0 thì stdout chỉ vào debug log và Claude
không thấy gì; chỉ exit 2 mới đẩy stderr cho Claude như cảnh báo. Tool đã chạy xong rồi nên
exit 2 ở đây không chặn được gì — chỉ để báo.

### Lưu ý khi thêm hook mới

- Event nào có `matcher`: `PreToolUse`, `PostToolUse`, `SessionStart`, `Notification`,
  `SubagentStart/Stop`, `FileChanged`… Event **không** có: `Stop`, `UserPromptSubmit`,
  `PostToolBatch`…
- Script nhận JSON qua **stdin**. Lấy field bằng `jq -r '.tool_input.file_path // empty'`
- Hook trong file settings đã commit sẽ chạy trên máy mọi người clone repo — chỉ đưa vào
  `settings.json` thứ bạn muốn cả team chạy; thứ riêng mình thì để `settings.local.json`
- Test hook bằng cách bơm payload giả, đừng chờ nó tự chạy:
  ```bash
  echo '{"tool_input":{"file_path":"'$PWD'/.claude/skills/x/SKILL.md"}}' \
    | bash .claude/hooks/validate-claude-config.sh; echo "exit=$?"
  ```

---

## 5. `rules/` — quy ước tự đến khi cần

Rule **không** có `paths:` thì nạp ngay đầu session, ngang hàng `CLAUDE.md`.
Rule **có** `paths:` chỉ nạp khi Claude đọc file khớp glob.

```yaml
---
paths:
  - "src/repositories/**/*.js"
  - "src/config/database.js"
---
```

Glob là **đường dẫn tương đối từ gốc repo**, không cần `**/` ở đầu. `src/routes/**/*.js`
hoạt động đúng như viết.

Hệ quả thực tế: bạn nói *"sửa endpoint `/stocks` để hỗ trợ phân trang"* → Claude mở
`stock.route.js` là `api-conventions.md` vào context, mở `user.repository.js` là
`database.md` vào. Bạn không phải nhắc gì.

Khi `CLAUDE.md` chạm ngưỡng 200 dòng thì tách phần chỉ liên quan một mảng code ra thành rule.

---

## 6. `skills/` — quy trình gọi theo yêu cầu

Tên command lấy từ **tên thư mục**, không phải field `name`. Nên `skills/new-endpoint/`
→ `/new-endpoint`.

### `/new-endpoint <method> <path>`

```
/new-endpoint GET /stocks/:symbol/history
```

Hai khối `` !`...` `` trong SKILL.md chạy **trước**, output được chèn thẳng vào prompt:
cấu trúc `src/` hiện tại và các route đã mount trong `app.js`. Nhờ vậy Claude không đoán
cấu trúc. Sau đó đi qua 6 lớp: schema → validation → repository → service → controller →
route, rồi mount vào `app.js`.

Skill này Claude **cũng tự gọi được** — nói "thêm endpoint lấy lịch sử giá" là nó có thể
tự nạp vì `description` khớp.

### `/security-review [đường dẫn]`

Ba file phối hợp:

| File | Vai trò |
|---|---|
| `SKILL.md` | entrypoint, 5 nhóm rủi ro theo thứ tự ưu tiên |
| `scripts/scan.sh` | grep sơ bộ, gọi qua `${CLAUDE_SKILL_DIR}`, kết quả chèn vào prompt |
| `checklist.md` | checklist đầy đủ 6 mục, Claude tự đọc khi SKILL.md nhắc tên |

Đường dẫn thư mục skill được thêm vào đầu SKILL.md, nên chỉ cần nhắc tên `checklist.md`
là Claude tìm được — không phải ghi đường dẫn tuyệt đối.

Skill này có `disable-model-invocation: true`: **chỉ bạn gọi được**, Claude không tự gọi,
và `description` của nó không nằm trong context. Đúng cho việc audit — chạy khi bạn quyết định.

Kết quả `scan.sh` chia mức `[CAO]/[TRUNG]/[THẤP]` và chỉ là **gợi ý**; SKILL.md yêu cầu
mở file xác nhận trước khi báo cáo.

---

## 7. `commands/` và `agents/`

### Commands — prompt một file

`/check-routes` dựng bảng mọi route kèm prefix `/nodejs-template/api`, chỉ ra handler async
thiếu `asyncHandler`, route thiếu `validate` hoặc `authenticate`.

`/fix-bug <mô tả hoặc file:line>` định vị bug thuộc lớp nào, sửa ở lớp đúng, `node --check`,
rồi verify bằng curl nếu bug nằm trên đường request.

Command hỗ trợ cùng frontmatter với skill, trừ `name` và `paths` (bị bỏ qua).
Nếu skill và command trùng tên thì **skill được ưu tiên**.

### Agents — context window riêng

Mỗi subagent chạy trong context riêng, giữ hội thoại chính gọn. Gõ `@` rồi chọn để delegate.

`@code-reviewer` — `tools: Read, Grep, Glob`, không có `Bash`, không có `Write`/`Edit`.
Read-only thật sự.

`@api-tester` — `tools: Bash, Read, Grep`, gọi HTTP thật. Nó được dặn **không tự khởi động
server**; bạn chạy `npm run dev` trước.

---

## 8. Skill built-in — đừng tạo lại cái đã có

Claude Code có sẵn một bộ skill, không cần viết vào `.claude/`. Ba cái liên quan nhất:

| Skill | Làm gì | Dùng khi |
|---|---|---|
| `/simplify` | soát code đã thay đổi về trùng lặp, đơn giản hoá, hiệu năng — rồi **tự sửa** | refactor sau khi vừa viết xong |
| `/code-review` | review diff/branch/path tìm **bug**; có `--fix` để áp dụng | trước khi commit |
| `/run` | khởi động app và thao tác thật | muốn kiểm chứng thay vì tin test |

Gõ `/` trong session để xem toàn bộ danh sách, cả built-in lẫn của project.

**Cảnh báo về trùng tên:** skill của project đè bundled skill cùng tên (nhưng không đè
*alias* của nó). `skills/security-review/` của ta đang đè bundled `/security-review`.
Ở đây không sao — nhu cầu "review diff trước commit" đã có `/code-review` lo, và bản
của project hiểu rõ pg-promise, `authenticate`, `env.js` của codebase này hơn bản generic.
Nhưng đừng đặt tên skill mới là `code-review`, `run`, `simplify`, `init`, `doctor`.

---

## 9. `workflows.disabled/` — đang tắt có chủ ý

Claude Code chỉ nạp workflow từ thư mục tên đúng `workflows/`, nên tên
`workflows.disabled` không được quét.

Bật lại:

```bash
mv .claude/workflows.disabled .claude/workflows
# rồi /reload-skills để nạp lại mà không cần session mới
```

Vì sao tắt: workflow là script điều phối hàng chục subagent, và **đúng cách dùng là để
Claude tự viết ra rồi lưu lại**, không phải soạn tay. Quy trình đúng:

1. Gõ prompt kèm `ultracode`, ví dụ
   `ultracode: audit mọi route trong src/routes/ xem có thiếu authenticate không`
2. Claude viết script, bạn approve, nó chạy background
3. Nếu kết quả tốt → `/workflows`, chọn run, bấm `s` để lưu vào `.claude/workflows/`
4. Từ đó nó thành command `/tên` dùng lại được

File `full-review.js` trong đó là script soạn tay chưa từng chạy, nên chưa có gì bảo đảm
nó đúng. Project này mới ~23 file source — fan-out 16 agent để audit là quá tay.
Workflow đáng dùng khi có 200 file cần migrate, hoặc chạy `tsc --noEmit` rồi sửa lặp
đến khi sạch.

---

## 10. Chín cái bẫy đã gặp thật

Tất cả đều đã kiểm chứng trong project này, không phải lý thuyết.

**1. YAML frontmatter sai âm thầm.** `argument-hint: <method> <path> — ví dụ: GET /x`
có dấu `: ` ở giữa → YAML đọc thành nested mapping và **parse lỗi cả frontmatter**,
skill mất luôn `description`. Còn `argument-hint: [a, b]` bị đọc thành **list** chứ không
phải string. **Luôn quote giá trị có dấu `:`, `[`, `{`, `#`.**
Hook `validate-claude-config.sh` (mục 4) giờ bắt tự động cả ba biến thể của lỗi này.

**2. `memory:` trên agent nới quyền ngoài ý muốn.** Thêm `memory: project` thì Claude Code
**tự cấp thêm Read/Write/Edit** để agent ghi `MEMORY.md` — nên một agent khai
`tools: Read, Grep, Glob` vẫn sửa được file. Muốn read-only thật thì đừng dùng `memory:`.

**3. Output style mặc định xoá hướng dẫn engineering.** `keep-coding-instructions` default
là `false`, nghĩa là style custom **gỡ bỏ** toàn bộ built-in software-engineering
instructions. Chỉ để `false` khi Claude không còn làm việc code nữa.

**4. Output style không có hiệu lực ngay.** System prompt đọc một lần lúc khởi động →
phải `/clear` hoặc mở session mới.

**5. Deny rule làm abort cả skill.** `` !`cmd` `` trong skill không cần `allowed-tools` và
không bao giờ hỏi permission — nhưng nếu command khớp một **deny rule** thì cả lần gọi skill
bị huỷ với `Shell command permission check failed`. Đừng để bash injection chạm vào lệnh
đang bị deny.

**6. Tên command đến từ tên thư mục/file**, không phải field `name`. Đổi `name:` trong
frontmatter không đổi cách gõ.

**7. Đừng phụ thuộc công cụ chưa có.** Bản đầu của `commands/fix-issue.md` dùng
`gh issue view` trong khi máy chưa cài `gh` và repo chưa có git → command chết hoàn toàn.
Kiểm tra `command -v <tool>` trước khi viết vào.

**8. Script kèm skill phải gọi qua `${CLAUDE_SKILL_DIR}`**, không dùng đường dẫn tương đối.

**9. Bốn file nằm ở gốc repo, không trong `.claude/`:** `CLAUDE.md` (hoặc
`.claude/CLAUDE.md`), `CLAUDE.local.md`, `.mcp.json`, `.worktreeinclude`.

---

## 11. Thứ tự ưu tiên

Từ cao xuống thấp:

```
managed-settings.json         (tổ chức áp đặt, không override được)
    ↓
CLI flags                     (--permission-mode, --settings)
    ↓
.claude/settings.local.json   (cá nhân, project này)
    ↓
.claude/settings.json         (team, project này)
    ↓
~/.claude/settings.json       (cá nhân, mọi project)
```

- Setting dạng **mảng** như `permissions.allow`: **gộp** từ mọi cấp
- Setting dạng **đơn** như `model`: lấy giá trị **cụ thể nhất**

Với skill/agent/rule cùng tên: `enterprise > personal (~/.claude) > project > bundled`.

`CLAUDE.md` hoạt động khác: global và project **đều được nạp** cùng lúc, không merge theo
key; khi hướng dẫn xung đột thì cấp project thắng.

---

## 12. Thêm mới thế nào

Tiêu chí trước khi tạo skill: **bạn đã giải thích lại cùng một quy trình nhiều bước từ
3 lần trở lên.** Chưa đạt thì đừng tạo — cứ nói bằng lời, `rules/` đã mang quy ước tới rồi.

Chỗ đặt tuỳ mục đích:

| Muốn gì | Đặt ở đâu |
|---|---|
| Cả team dùng | `.claude/` (commit) |
| Chỉ mình, project này | `.claude/settings.local.json` (gitignored) |
| Chỉ mình, mọi project | `~/.claude/` |

Sau khi thêm hoặc sửa file trong `.claude/`, chạy `/reload-skills` để nạp lại mà không
phải mở session mới. Riêng output style thì cần `/clear`.

Nên kiểm YAML trước khi commit:

```bash
python3 -c "
import yaml, pathlib
for p in sorted(pathlib.Path('.claude').rglob('*.md')):
    t = p.read_text()
    if not t.startswith('---'): continue
    try: print('OK  ', p, list(yaml.safe_load(t.split(chr(10)+'---'+chr(10))[0][4:]).keys()))
    except Exception as e: print('LỖI', p, e)"
```

---

## 13. Khi cấu hình không có tác dụng

| Triệu chứng | Kiểm tra |
|---|---|
| Rule/CLAUDE.md không được tuân theo | `/context` → xem mục **Memory files** có file đó chưa |
| Skill không hiện trong `/` | YAML frontmatter có parse được không (mục 10.1); có `user-invocable: false`? |
| Skill Claude không tự gọi | có `disable-model-invocation: true`? |
| Output style không đổi gì | đã `/clear` chưa |
| Đổi file `.claude/` mà không thấy gì | `/reload-skills` |
| Không rõ file nào đã nạp | hook `InstructionsLoaded` ghi log |

Lệnh hữu ích: `/memory` (mở sửa CLAUDE.md), `/config` (setting qua UI),
`/context` (xem đã nạp gì), `/doctor` (checkup cấu hình).

Chi tiết: https://code.claude.com/docs/en/debug-your-config
