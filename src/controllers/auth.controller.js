import * as authService from '#services/auth.service.js'
import {success} from "#utils/response.utils.js";

export const login = async (req, res) => {
    const {email, password} = req.body;
    const tokenPair = await authService.login({email, password});
    return success(res, tokenPair);
}

export const refresh = async (req, res) => {
    const {refreshToken} = req.body;
    const tokenPair = authService.refreshToken(refreshToken);
    return success(res, tokenPair);
}
