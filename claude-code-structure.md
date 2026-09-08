# Cấu trúc thư mục Claude Code — Bản tham chiếu

Đối chiếu với tài liệu chính thức: https://code.claude.com/docs/en/claude-directory

---

## 1. Cấu trúc cấp project

```
your-project/
│
├── CLAUDE.md                        # [commit] Hướng dẫn load mỗi session
├── CLAUDE.local.md                  # [gitignore] Ghi chú riêng của bạn cho project này
├── .mcp.json                        # [commit] MCP server dùng chung cho team
├── .worktreeinclude                 # [commit] File gitignored cần copy vào worktree mới
│
└── .claude/
    │
    ├── settings.json                # [commit] permissions, hooks, env, model
    ├── settings.local.json          # [gitignore] Override cá nhân
    │
    ├── rules/                       # [commit] Hướng dẫn theo chủ đề
    │   ├── architecture.md
    │   ├── testing.md               # frontmatter paths: → load có điều kiện
    │   └── frontend/                # Thư mục con được nhận tự động
    │       └── react.md
    │
    ├── skills/                      # [commit] Workflow tái sử dụng
    │   ├── security-review/
    │   │   ├── SKILL.md             # BẮT BUỘC — entrypoint
    │   │   ├── checklist.md         # File tham chiếu kèm theo
    │   │   └── scripts/
    │   │       └── scan.sh
    │   └── deploy/
    │       └── SKILL.md
    │
    ├── commands/                    # [commit] Prompt một file → /tên
    │   └── fix-issue.md
    │
    ├── agents/                      # [commit] Subagent, mỗi con một context riêng
    │   ├── code-reviewer.md
    │   └── test-runner.md
    │
    ├── workflows/                   # [commit] Script điều phối nhiều subagent
    │   └── release.js
    │
    ├── output-styles/               # [commit] Chỉ khi team dùng chung một style
    │   └── review-mode.md
    │
    └── agent-memory/                # [commit] Claude TỰ SINH — không tự viết
        └── code-reviewer/
            └── MEMORY.md
```

### Ba file nằm ở ROOT, không nằm trong `.claude/`

Đây là lỗi phổ biến nhất khi dựng cấu trúc:

- `CLAUDE.md` — chấp nhận cả hai vị trí: root hoặc `.claude/CLAUDE.md`
- `.mcp.json` — **chỉ** ở root
- `.worktreeinclude` — **chỉ** ở root

---

## 2. Cấu trúc cấp user (áp dụng mọi project)

```
~/
├── .claude.json                     # App state: theme, OAuth, MCP cá nhân, trust
│
└── .claude/
    ├── CLAUDE.md                    # Preference cá nhân, load ở MỌI project
    ├── settings.json                # Default cho mọi project
    ├── keybindings.json             # Phím tắt tùy chỉnh
    │
    ├── themes/
    │   └── dracula.json
    │
    ├── rules/                       # Giống cấp project, nhưng global
    ├── skills/
    ├── commands/
    ├── agents/
    ├── workflows/
    ├── output-styles/
    ├── agent-memory/                # Subagent có memory: user
    │
    ├── plugins/                     # KHÔNG XÓA — plugin đã cài
    │
    └── projects/                    # Claude TỰ SINH
        └── <project-path>/
            └── memory/              # Auto memory
                ├── MEMORY.md        # Index, đọc mỗi session
                └── debugging.md     # Topic file, đọc theo nhu cầu
```

Trên Windows, `~/.claude` là `%USERPROFILE%\.claude`. Nếu set biến môi trường `CLAUDE_CONFIG_DIR` thì mọi đường dẫn `~/.claude` chuyển sang thư mục đó.

**Không được xóa:** `~/.claude.json`, `~/.claude/settings.json`, `~/.claude/plugins/` — chứa auth, preference và plugin đã cài.

---

## 3. Thứ tự ưu tiên

Từ cao xuống thấp:

```
managed-settings.json        (tổ chức áp đặt, không override được)
    ↓
CLI flags                    (--permission-mode, --settings)
    ↓
.claude/settings.local.json  (cá nhân, project này)
    ↓
.claude/settings.json        (team, project này)
    ↓
~/.claude/settings.json      (cá nhân, mọi project)
```

Hai kiểu merge khác nhau:

- **Setting dạng mảng** như `permissions.allow`: **gộp** lại từ mọi cấp
- **Setting dạng đơn** như `model`: lấy giá trị **cụ thể nhất**

CLAUDE.md hoạt động khác hẳn: global và project **đều được load vào context** cùng lúc, không merge theo key. Khi hướng dẫn xung đột thì cấp project thắng.

---

## 4. Nội dung mẫu

### CLAUDE.md

Mục tiêu dưới 200 dòng. File dài hơn vẫn load đủ nhưng làm giảm mức độ tuân thủ. Nếu điều gì chỉ liên quan tới một loại task cụ thể, đưa vào skill hoặc rule có `paths:`.

```markdown
# Project conventions

## Commands
- Build: `npm run build`
- Test: `npm test`
- Lint: `npm run lint`

## Stack
- TypeScript strict mode
- React 19, chỉ functional component

## Rules
- Named export, không dùng default export
- Test nằm cạnh source: `foo.ts` → `foo.test.ts`
- Mọi API route trả về shape `{ data, error }`
```

### .claude/settings.json

Khác với CLAUDE.md là hướng dẫn Claude *đọc*, đây là cấu hình được **cưỡng chế thi hành** bất kể Claude có tuân theo hay không.

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(npm test *)",
      "Bash(npm run *)",
      "Bash(git diff *)"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Read(.env)",
      "Read(.env.*)"
    ]
  },
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{
        "type": "command",
        "command": "jq -r '.tool_input.file_path' | xargs npx prettier --write"
      }]
    }]
  },
  "model": "claude-opus-5"
}
```

Thứ tự đánh giá permission: **deny trước, rồi ask, cuối cùng allow**. Deny luôn thắng dù có allow trùng khớp. Lệnh không nằm trong cả hai danh sách thì Claude sẽ hỏi.

Pattern hỗ trợ wildcard: `Bash(npm test *)` khớp mọi lệnh bắt đầu bằng `npm test`.

Các key thường dùng: `permissions`, `hooks`, `statusLine`, `model`, `env`, `outputStyle`.

### .claude/rules/testing.md

Rule không có `paths:` thì load ngay từ đầu session, giống CLAUDE.md. Rule có `paths:` chỉ load khi Claude đọc file khớp glob.

```markdown
---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
---

# Testing Rules

- Tên test mô tả rõ: "should [expected] when [condition]"
- Mock dependency bên ngoài, không mock module nội bộ
- Dọn side effect trong afterEach
```

Giống CLAUDE.md, rule là **hướng dẫn** Claude đọc, không phải cấu hình được cưỡng chế. Muốn đảm bảo chắc chắn thì dùng hooks hoặc permissions.

### .claude/skills/security-review/SKILL.md

```markdown
---
description: Rà soát thay đổi code tìm lỗ hổng bảo mật, thiếu sót xác thực và rủi ro injection
disable-model-invocation: true
argument-hint: <branch-or-path>
---

## Diff cần review

!`git diff $ARGUMENTS`

Audit các thay đổi trên về:

1. Injection (SQL, XSS, command)
2. Thiếu sót authentication và authorization
3. Secret hoặc credential hardcode

Dùng checklist.md trong thư mục skill này để có checklist đầy đủ.
```

Điểm cần biết:

- Trường `description` quyết định khi nào Claude tự gọi skill
- `disable-model-invocation: true` → chỉ user gọi được, dùng cho workflow như `/deploy`
- `user-invocable: false` → ẩn khỏi menu `/`, nhưng Claude vẫn gọi được
- `$ARGUMENTS` nhận toàn bộ phần sau tên skill; `$0`, `$1` để lấy theo vị trí
- Cú pháp `` !`...` `` chạy shell command và chèn output vào prompt
- Đường dẫn thư mục skill được thêm vào đầu SKILL.md, nên Claude đọc được file kèm theo chỉ bằng cách bạn nhắc tên
- Với script trong bash injection, dùng placeholder `${CLAUDE_SKILL_DIR}`
- Nếu skill và command trùng tên, **skill được ưu tiên**

### .claude/agents/code-reviewer.md

```markdown
---
name: code-reviewer
description: Review code về tính đúng đắn, bảo mật và khả năng bảo trì
tools: Read, Grep, Glob
---

Bạn là senior code reviewer. Review về:

1. Correctness: lỗi logic, edge case, xử lý null
2. Security: injection, bypass auth, lộ dữ liệu
3. Maintainability: đặt tên, độ phức tạp, trùng lặp

Mỗi phát hiện phải kèm một cách sửa cụ thể.
```

Mỗi subagent chạy trong **context window riêng**, giữ cho hội thoại chính gọn gàng. Dùng `tools:` để giới hạn quyền. Gõ `@` rồi chọn agent để delegate trực tiếp.

Thêm `memory: project` vào frontmatter nếu muốn agent có memory bền vững — nó sẽ tự ghi vào `.claude/agent-memory/<tên>/MEMORY.md`. Ba lựa chọn: `project` (chia sẻ với team), `local` (ghi vào `.claude/agent-memory-local/`, ngoài git), `user` (ghi vào `~/.claude/agent-memory/`, xuyên project).

### .mcp.json

```json
{
  "mcpServers": {
    "notion": {
      "command": "npx",
      "args": ["-y", "@notionhq/notion-mcp-server"],
      "env": {
        "NOTION_TOKEN": "${NOTION_TOKEN}"
      }
    }
  }
}
```

Dùng tham chiếu biến môi trường `${TOKEN}` cho secret — token không bao giờ nằm trong file. Server chỉ riêng bạn dùng thì chạy `claude mcp add --scope user`, nó ghi vào `~/.claude.json` thay vì `.mcp.json`.

---

## 5. Cấu trúc plugin

Khác hoàn toàn với cấu trúc project — đừng lẫn hai cái.

```
my-plugin/
├── .claude-plugin/
│   └── plugin.json              # BẮT BUỘC nằm ở đây
├── commands/
├── agents/
├── skills/
│   └── skill-name/
│       └── SKILL.md
├── hooks/
│   └── hooks.json
├── .mcp.json
└── scripts/
```

Ba quy tắc bắt buộc:

1. Manifest `plugin.json` **phải** nằm trong `.claude-plugin/`
2. Các thư mục component (`commands`, `agents`, `skills`, `hooks`) **phải** ở gốc plugin, **không** lồng trong `.claude-plugin/`
3. Đặt tên kebab-case cho mọi file và thư mục

Dùng `${CLAUDE_PLUGIN_ROOT}` để tham chiếu đường dẫn có tính di động. Chỉ tạo thư mục cho component plugin thực sự dùng.

---

## 6. Hook events

Khai báo trong `settings.json` (cấp project/user) hoặc `hooks/hooks.json` (trong plugin):

| Event | Thời điểm chạy |
|---|---|
| `PreToolUse` | Trước khi gọi tool — có thể chặn |
| `PostToolUse` | Sau khi tool chạy xong |
| `SessionStart` | Đầu session |
| `SessionEnd` | Cuối session |
| `Stop` | Khi Claude dừng phản hồi |
| `Notification` | Khi có thông báo |
| `PreCompact` | Trước khi nén context |
| `WorktreeCreate` | Khi tạo worktree mới |

---

## 7. .gitignore nên có

```gitignore
# Cấu hình cá nhân Claude Code
.claude/settings.local.json
.claude/agent-memory-local/
CLAUDE.local.md
```

Khi Claude Code lưu setting vào `settings.local.json` trong repo chưa ignore file này, nó tự thêm `**/.claude/settings.local.json` vào global git excludes của bạn. Nhưng muốn chia sẻ quy tắc ignore đó với team thì vẫn phải tự thêm vào `.gitignore` của project.

---

## 8. Lộ trình triển khai

Đừng dựng hết một lượt. Phần lớn người dùng chỉ sửa `CLAUDE.md` và `settings.json`; còn lại là tùy chọn, thêm khi cần.

1. **`CLAUDE.md`** — conventions, lệnh build/test/lint
2. **`.claude/settings.json`** — allow lệnh chạy thường xuyên, deny đọc `.env` và lệnh phá hoại
3. **`.claude/skills/`** — một hai workflow bạn lặp lại nhiều nhất
4. **`.claude/rules/`** — khi CLAUDE.md chạm ngưỡng 200 dòng thì tách ra
5. **`.claude/agents/`** — khi có task phức tạp cần context riêng
6. **`hooks` và `.mcp.json`** — khi cần tự động hóa theo event hoặc tích hợp tool ngoài

---

## 9. Lệnh hữu ích

```bash
/memory              # Mở và sửa CLAUDE.md ngay trong session
/config              # Chỉnh setting qua UI
/theme               # Tạo hoặc chọn theme
/keybindings         # Tạo hoặc mở file phím tắt
/workflows           # Chạy và lưu dynamic workflow
/insights            # Phân tích usage
/usage               # Xem token và chi phí
claude project purge # Xóa toàn bộ state của một project
```

Nếu setting, hook hoặc file không có tác dụng, xem `code.claude.com/docs/en/debug-your-config`.

---

## 10. Lưu ý về bảo mật

Transcript và history **không được mã hóa** khi lưu trên đĩa — chỉ có file permission của OS bảo vệ. Nếu một tool đọc file `.env` hoặc một lệnh in ra credential, giá trị đó sẽ nằm trong `~/.claude/projects/<project>/<session>.jsonl`.

Giảm rủi ro bằng cách:

- Hạ `cleanupPeriodDays` để rút ngắn thời gian giữ transcript (mặc định 30 ngày, tối thiểu 1)
- Set `CLAUDE_CODE_SKIP_PROMPT_HISTORY` để không ghi transcript và history
- Dùng permission rule deny đọc file credential
