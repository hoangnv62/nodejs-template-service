import {z} from "zod";

export const stockIdParamSchema = z.object({
    stockId: z.coerce
        .number({error: "StockId phải là số"})
        .int("StockId phải là số nguyên")
        .positive("StockId không hợp lệ")
});