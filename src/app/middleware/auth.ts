import httpStatus from 'http-status';
import config from '../config/index';
import AppError from '../error/AppError';
import { User } from '../modules/user/user.models';
import catchAsync from '../utils/catchAsync';
import { verifyToken } from '../utils/tokenManage';

const auth = (...userRoles: string[]) => {
  return catchAsync(async (req, res, next) => {

    const token = req?.headers?.authorization?.split(' ')[1];
    // const token = req?.headers?.authorization;


    if (!token) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'you are not authorized!');
    }

    const decodeData = verifyToken({
      token,
      access_secret: config.jwt_access_secret as string,
    });



    const { role, userId } = decodeData;
    const isUserExist = await User.IsUserExistById(userId);

    if (!isUserExist) {
      throw new AppError(httpStatus.NOT_FOUND, 'user not found');
    }

    if (userRoles && !userRoles.includes(role)) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not authorized....');
    }
    req.user = decodeData;
    next();
  });
};
export default auth;
