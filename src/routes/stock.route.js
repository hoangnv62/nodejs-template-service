import { Router } from 'express';
import {asyncHandler} from "#middlewares/async-handler.middleware.js";
import {authenticate} from "#middlewares/auth.middleware.js";
import * as stockController from "#controllers/stock.controller.js";
const router = Router();
router.get('/', asyncHandler(stockController.searchStock));
router.get('/my-stock', authenticate ,asyncHandler(stockController.searchMyStocks))

export default router;