---
paths:
  - "src/routes/**/*.js"
  - "src/controllers/**/*.js"
  - "src/validations/**/*.js"
  - "app.js"
---

# API conventions

## Response thành công

Luôn qua helper trong `#utils/response.utils.js`:

```js
import { success, created, successMsg } from "#utils/response.utils.js";

export const getStock = async (req, res) => success(res, await stockService.findOne(req.params.id));
```

Danh sách có phân trang dùng `paginated(items, page, size, total)` từ `#utils/common.utils.js`.

## Response lỗi

Không tự build response lỗi. Throw error từ `#exception/errors.js`, `errorHandler`
sẽ chuẩn hoá thành:

```json
{ "error": "ENTITY_NOT_FOUND", "errorDescription": "Không tìm thấy mã CK" }
```

Status code và mã lỗi lấy từ `apiResponseCode` trong `#constants/api-response.constant.js` —
thêm mã mới vào đó trước khi dùng, đừng hardcode số.

## Route

```js
const router = Router();
router.get('/', validate({ query: searchQuerySchema }), asyncHandler(stockController.searchStock));
router.get('/my-stock', authenticate, asyncHandler(stockController.searchMyStocks));
export default router;
```

- Mỗi handler async **phải** bọc `asyncHandler`, nếu không lỗi promise sẽ không tới `errorHandler`
- `validate` đặt trước `asyncHandler`; `authenticate` đặt trước `validate`
- Route path viết tương đối với prefix mount trong `app.js`, đừng lặp lại `/nodejs-template/api`

## Validation

Schema nằm trong `src/validations/schema/`, middleware nằm trong `src/validations/`.
`validate` ghi lại `req.body`/`req.params`/`req.query` bằng dữ liệu đã parse — nên
controller đọc thẳng giá trị đã được coerce, không parse lại.
