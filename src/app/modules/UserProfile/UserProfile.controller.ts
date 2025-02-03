import { Request, Response } from 'express';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import catchAsync from '../../utils/catchAsync';
import { storeFile } from '../../utils/fileHelper';
import sendResponse from '../../utils/sendResponse';
import { UserProfileService } from './UserProfile.service';

/**
 * Create a new UserProfile.
 */

const addNew = catchAsync(async (req: Request, res: Response) => {
  // const UserProfileData = req.body;
  // const file = req.file as Express.Multer.File;
  // if (!file) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Images are required');
  // }

  const UserProfileData = { ...req.body };
  if (req?.file) {
    UserProfileData.image = storeFile('profile', req?.file?.filename);
  }

  const result = await UserProfileService.addNew( UserProfileData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'New UserProfile added successfully!',
    data: result,
  });
});

/**
 * Get all UserProfiles.
 */

const getAll = catchAsync(async (req: Request, res: Response) => {
  const UserProfiles = await UserProfileService.getAll(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All UserProfile retrieved successfully!',
    data: UserProfiles.result,
    meta: UserProfiles.meta,
  });
});

/**
 * Get a single UserProfile by ID.
 */
const getOneById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const UserProfile = await UserProfileService.getOneById(id);
  if (!UserProfile) throw new Error('UserProfile not found');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserProfile retrieved successfully!',
    data: UserProfile,
  });
});

/**
 * Update a UserProfile.
 */
const updateById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data = { ...req.body };
  if (req?.file) {
    data.image = storeFile('profile', req?.file?.filename);
  }

  const result = await UserProfileService.updateById(id, data);
  console.log('==== result ==== ', result);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserProfile updated successfully!',
    data: result,
  });
});

/**
 * Soft delete a UserProfile.
 */
const deleteById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;

  const UserProfile = await UserProfileService.deleteById(id);
  if (!UserProfile) throw new Error('UserProfile not found');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserProfile deleted successfully!',
    data: UserProfile,
  });
});

export const UserProfileController = {
  addNew,
  getAll,
  getOneById,
  updateById,
  deleteById,
};
