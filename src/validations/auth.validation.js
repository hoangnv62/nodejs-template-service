import {validate} from "#validations/validate-handler.js";
import {loginSchema, refreshTokenSchema} from "#validations/schema/auth.schema.js";

export const validateLogin = validate({body: loginSchema})
export const validateRefreshToken = validate({body: refreshTokenSchema})