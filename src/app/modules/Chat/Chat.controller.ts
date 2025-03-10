import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { ChatService } from './Chat.service';
import { PetProfile } from '../PetProfile/PetProfile.models';
import { storeFile } from '../../utils/fileHelper';

const addNewChat = catchAsync(async (req: Request, res: Response) => {
  console.log('req body -> ', req.body);
  // const UserProfileData = JSON.parse(req.body.data);
  // console.log({ UserProfileData });
  // const file = req?.file as Express.Multer.File;
  // console.log({ file });

  const chatData = { ...req.body };
  if (req?.file) {
    chatData.groupProfilePicture = storeFile('profile', req?.file?.filename);
  }
  // console.log("chat data ====>>>> ",{chatData});
  const result = await ChatService.addNewChat(chatData);
  
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'Chat is created successfully!',
    data: result,
  });
});

const leaveUserFromSpecificChatController = catchAsync(
  async (req: Request, res: Response) => {
    const { chatId } = req.params;
    const userId = req.user.userId;

    console.log('req user = > ', req.user);
    const payload = {
      chatId,
      userId
    }

    const PetProfileData = await PetProfile.findOne({userId}).select("name")
    
    console.log({payload})
    const result = await ChatService.leaveUserFromSpecific(payload);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: `${PetProfileData?.name} has left the chat...`,
      data: result,
    });
  },
);

const updateChatById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  // const UserProfileData = req.body;
  // const file = req?.file as Express.Multer.File;

  const chatUpdateData = { ...req.body };
  if (req?.file) {
    chatUpdateData.groupProfilePicture = storeFile('profile', req?.file?.filename);
  }
  
  const result = await ChatService.updateChatById(id, chatUpdateData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'New UserProfile added successfully!',
    data: result,
  });
});

const getUserChats = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const chats = await ChatService.getUserChats(req.params.userId);

    // console.log("==== chats list =====>>>>>>> ", chats)
    res.status(200).json({
      success: true,
      message: 'Chats retrieved successfully!',
      data: chats,
    });
  } catch (error) {
    next(error);
  }
};

const getChatById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await ChatService.getChatById(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Chat retrieved successfully!',
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

const updateUnreadCounts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { id } = req.params;
    const { userId, unreadCount } = req.body;
    const updatedChat = await ChatService.updateUnreadCounts(
      id,
      userId,
      unreadCount,
    );
    res.status(200).json({
      success: true,
      message: 'Unread counts updated successfully!',
      data: updatedChat,
    });
  } catch (error) {
    next(error);
  }
};


// Block a user
const blockUser = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const {blockUserId} = req.body;
  const userId = req.user.userId;

  const result = await ChatService.blockUser(chatId, userId, blockUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User blocked successfully!',
    data: result,
  });
});

// Unblock a user
const unblockUser = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { blockUserId } = req.body;
  const userId = req.user.userId;

  const result = await ChatService.unblockUser(chatId, userId, blockUserId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'User unblocked successfully!',
    data: result,
  });
});

// Delete a chat for a user (soft delete)
const deleteChatForUser = catchAsync(async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const {userId} = req.user;

  const result = await ChatService.deleteChatForUser(chatId, userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Chat deleted successfully!',
    data: result,
  });
});

const deleteChat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const chat = await ChatService.deleteChat(req.params.id);
    res.status(200).json({
      success: true,
      message: 'Chat deleted successfully!',
      data: chat,
    });
  } catch (error) {
    next(error);
  }
};

export const ChatController = {
  addNewChat,
  leaveUserFromSpecificChatController,
  getUserChats,
  getChatById,
  updateUnreadCounts,
  deleteChat,
  updateChatById,
  blockUser,
  unblockUser,
  deleteChatForUser,
};
