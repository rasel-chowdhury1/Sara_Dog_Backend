import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from "http-status";
import { BlockUserService } from "./BlockedUser.service";


const blockUser = catchAsync(async (req: Request, res: Response) => {

  const {userId} = req.user;
  const {blockUserId} = req.params;


  const result = await BlockUserService.blockUser(userId, blockUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "User blocked successfully. ",
    data: result,
  });
});


const unBlockUser = catchAsync(async (req: Request, res: Response) => {

  const { userId } = req.user;
  const { blockUserId } = req.params;

  const result = await BlockUserService.unblockUser(userId, blockUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User unblocked successfully...!',
    data: result,
  });
});

const getBlockedUsers = catchAsync(async (req: Request, res: Response) => {
  
  const {userId} = req.user;

  const result = await BlockUserService.getBlockedUsers(userId)

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Blocked user retrived successfully!',
    data: result,
  });
});

export const BlockedUserController = {
    blockUser, 
    unBlockUser,
    getBlockedUsers
}