import {Router} from "express";
import * as authController from "#controllers/auth.controller.js";
import * as validator from '#validations/auth.validation.js'
import {asyncHandler} from "#middlewares/async-handler.middleware.js";

const router = Router();
router.post('/login', validator.validateLogin, asyncHandler(authController.login))
router.post('/refresh', validator.validateRefreshToken, asyncHandler(authController.refresh));
export default router;