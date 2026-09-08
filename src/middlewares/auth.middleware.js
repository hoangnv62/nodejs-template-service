import {validateToken} from '#services/jwt.service.js'
import {UnauthorizedError} from "#exception/errors.js";
import {TOKEN_TYPES} from "#constants/common.constants.js";

export const authenticate = (req, res, next) => {
    const auth = req.headers?.authorization;
    if (!auth || !auth.startsWith('Bearer ')) next(new UnauthorizedError("Token is missing"));

    try {
        const {userId, role, name} = validateToken(auth.slice(7), TOKEN_TYPES.ACCESS_TOKEN);
        req.user = {
            id: userId,
            name: name,
            role: role,
        }
        next();
    } catch (err) {
        next(err)
    }
}