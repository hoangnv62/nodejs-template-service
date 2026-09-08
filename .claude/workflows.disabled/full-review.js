export const meta = {
  name: 'full-review',
  description: 'Review song song src/ theo 4 chiều (kiến trúc, bảo mật, correctness, consistency) rồi xác minh lại từng phát hiện',
  phases: [{ title: 'Review' }, { title: 'Verify' }],
}

const FINDINGS_SCHEMA = {
  type: 'object',
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          file: { type: 'string' },
          line: { type: 'number' },
          severity: { type: 'string' },
          fix: { type: 'string' },
        },
        required: ['title', 'file', 'fix'],
      },
    },
  },
  required: ['findings'],
}

const VERDICT_SCHEMA = {
  type: 'object',
  properties: {
    isReal: { type: 'boolean' },
    reason: { type: 'string' },
  },
  required: ['isReal', 'reason'],
}

const DIMENSIONS = [
  {
    key: 'architecture',
    prompt: `Đọc src/ của stock-view-service. Tìm vi phạm kiến trúc phân lớp:
SQL ngoài src/repositories/, business logic trong controller, req/res truyền xuống service,
import tương đối thay vì subpath alias #..., handler async thiếu asyncHandler.`,
  },
  {
    key: 'security',
    prompt: `Đọc src/ của stock-view-service. Tìm rủi ro bảo mật: SQL nối chuỗi trong repository,
route thiếu authenticate, cột password bị trả về client, secret hardcode trong src/config/env.js,
jwt.decode dùng thay cho jwt.verify.`,
  },
  {
    key: 'correctness',
    prompt: `Đọc src/ của stock-view-service. Tìm lỗi đúng đắn: promise không await, db.one dùng ở
chỗ có thể không có dòng nào, edge case null/undefined, error không được bọc thành AppError,
signature errorHandler của Express (phải đủ 4 tham số mới được nhận là error middleware).`,
  },
  {
    key: 'consistency',
    prompt: `Đọc src/ của stock-view-service. Tìm điểm không nhất quán: tên file lệch quy ước
<domain>.<layer>.js, response không đi qua helper trong #utils/response.utils.js,
status code hardcode thay vì lấy từ apiResponseCode, code chết hoặc code bị comment lại.`,
  },
]

const results = await pipeline(
  DIMENSIONS,
  d => agent(d.prompt, { label: `review:${d.key}`, phase: 'Review', schema: FINDINGS_SCHEMA }),
  review => parallel(
    review.findings.map(f => () =>
      agent(
        `Xác minh phản biện phát hiện sau bằng cách mở file và đọc code thật.
Nếu không tái hiện được thì trả isReal: false.

${f.title}
File: ${f.file}${f.line ? `:${f.line}` : ''}
Đề xuất sửa: ${f.fix}`,
        { label: `verify:${f.file}`, phase: 'Verify', schema: VERDICT_SCHEMA },
      ).then(v => ({ ...f, verdict: v })),
    ),
  ),
)

const confirmed = results.flat().filter(Boolean).filter(f => f.verdict?.isReal)
return { confirmed, total: results.flat().length }
