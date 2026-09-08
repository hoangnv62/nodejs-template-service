import * as userRepository from '#repositories/user.repository.js'
import {NotFoundError} from "#exception/errors.js";
export const findByEmail = async (email) =>{
    const user = await userRepository.findByEmail(email);
    if (!user) throw new NotFoundError("Không tìm thấy người dùng");
    return user;
}