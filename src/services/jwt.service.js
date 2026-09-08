import jwt from 'jsonwebtoken'
import {env} from "#config/env.js";
import {UnauthorizedError} from "#exception/errors.js";
import {TOKEN_TYPES} from "#constants/common.constants.js";

const secret = Buffer.from(env.JWT_BASE64_SECRET, 'base64');
export const generateTokenPair = ({userId, email, role, name}) => {
    const accessTokenExpiresIn = env.ACCESS_TOKEN_EXPIRES_IN
    const refreshTokenExpiresIn = env.REFRESH_TOKEN_EXPIRES_IN
    return {
        accessToken: generateToken({userId, email, role, name}, TOKEN_TYPES.ACCESS_TOKEN, accessTokenExpiresIn),
        refreshToken: generateToken({userId, email}, TOKEN_TYPES.REFRESH_TOKEN, refreshTokenExpiresIn),
        user: {
            id: userId,
            email: email,
            role: role,
            name: name
        }
    }
}

const generateToken = (userData, tokenType, expiresIn) => {
    const payload = {
        ...userData, tokenType,
    }
    return jwt.sign(
        payload,
        secret,
        {
            algorithm: 'HS512',
            expiresIn: expiresIn
        }
    )
}

export const validateToken = (token, tokenType) => {
    if (!token) throw new UnauthorizedError("Token is required");
    let payload;
    try {
        payload = jwt.verify(token, secret);
    } catch (err) {
        if (err.name === 'TokenExpiredError') throw new UnauthorizedError('Token expired');
        throw new UnauthorizedError('Invalid token');
    }
    if (!payload.tokenType || payload.tokenType !== tokenType) throw new UnauthorizedError("Token is invalid");
    return payload;
}
