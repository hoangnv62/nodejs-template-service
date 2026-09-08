import {success} from "#utils/response.utils.js";
import {paginated} from "#utils/common.utils.js";
import {getAllStocks} from "#services/vnstock.service.js";

export const searchMyStocks = async (req, res) => {
    return success(res, paginated([], 1, 1,1))
}

export const searchStock = async (req, res) => {
    return success(res, await getAllStocks())
}

