// vn-stock-sdk@1.0.1 publish lỗi: exports["."].import trỏ tới ./dist/index.esm.js
// nhưng bản build thực tế là ./dist/index.mjs, nên `import ... from "vn-stock-sdk"`
// bị ERR_MODULE_NOT_FOUND. Tạm nạp bản CJS (./dist/index.js) qua createRequire.
import {createRequire} from "node:module";
import axios from "axios";

const require = createRequire(import.meta.url);
const {VnStockClient, Interval, DataSource} = require("vn-stock-sdk");

export const client = new VnStockClient({
    timeout: 10000,
    retries: 3,
    debug: false,
});

// /stock/type/{stockType}/{exchange} lọc sẵn ở server theo loại chứng khoán:
// s = cổ phiếu, m = quỹ đóng/REIT, e = ETF, w = chứng quyền, b = trái phiếu.
// Dùng "s" để chỉ lấy cổ phiếu, khỏi phải filter phía mình.
const SSI_LISTING_API = "https://iboard-query.ssi.com.vn/stock/type/s";
const EXCHANGES = ["hose", "hnx"];
const STOCK_TYPES = {s: "stock", m: "fund", w: "coveredWarrant", b: "bond"};
// SSI iBoard trả 403 nếu User-Agent là mặc định của axios.
const SSI_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36",
    "Accept": "application/json",
};

const mapSsiStock = (item) => ({
    symbol: item.stockSymbol,
    name: item.companyNameVi || item.clientName,
    nameEn: item.companyNameEn || item.clientNameEn,
    exchange: (item.exchange || "").toUpperCase(),
    type: STOCK_TYPES[item.stockType] || item.stockType,
    isin: item.isin,
    parValue: item.parValue,
    tradingUnit: item.tradingUnit,
    refPrice: item.refPrice,
    ceiling: item.ceiling,
    floor: item.floor,
});

export const getAllStocks = async () => {
    const responses = await Promise.all(
        EXCHANGES.map((exchange) =>
            axios.get(`${SSI_LISTING_API}/${exchange}`, {
                timeout: 15000,
                headers: SSI_HEADERS,
            })
        )
    );
    return responses.flatMap((res) => (res.data?.data ?? []).map(mapSsiStock));
}
