import {validate} from "#validations/validate-handler.js";
import {stockIdParamSchema} from "#validations/schema/stock.schema.js";
export const validateStockId = validate({params: stockIdParamSchema})