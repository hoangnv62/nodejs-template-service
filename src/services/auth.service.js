import * as userService from "#services/user.service.js";
import * as jwtService from '#services/jwt.service.js'
import {BadRequestError, NotFoundError} from "#exception/errors.js";
import bcrypt from 'bcryptjs';
import {TOKEN_TYPES} from "#constants/common.constants.js";

export const login = async ({email, password}) => {
    const user = await userService.findByEmail(email);
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) throw new BadRequestError("Mật khẩu không đúng")
    return jwtService.generateTokenPair({userId: user.id, email: user.email, role: user.role, name: user.name})
}

export const refreshToken = async (refreshToken) => {
    const {email} = jwtService.validateToken(refreshToken, TOKEN_TYPES.REFRESH_TOKEN);
    const user = await userService.findByEmail(email);
    return jwtService.generateTokenPair({userId: user.id, email: user.email, role: user.role});
}