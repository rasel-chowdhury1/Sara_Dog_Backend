import { Request, Response } from 'express';
import httpStatus from 'http-status';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import AppError from '../../error/AppError';
import { PetProfileService } from './PetProfile.service';
import { storeFile } from '../../utils/fileHelper';

/**
 * Create a new UserProfile.
 */

const addNew = catchAsync(async (req: Request, res: Response) => {
  // const UserProfileData = req.body;
  // const file = req.file as Express.Multer.File;
  // if (!file) {
  //   throw new AppError(httpStatus.BAD_REQUEST, 'Images are required');
  // }
  const PetProfileData = { ...req.body };
  if (req?.file) {
    PetProfileData.image = storeFile('profile', req?.file?.filename);
  }
  const result = await PetProfileService.addNew(PetProfileData);
  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: 'New UserProfile added successfully!',
    data: result,
  });
});

/**
 * Get all PetProfile
 */

const getAll = catchAsync(async (req: Request, res: Response) => {
  const PetProfile = await PetProfileService.getAll(req.query);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'All UserProfile retrieved successfully!',
    data: PetProfile.result,
    meta: PetProfile.meta,
  });
});

/**
 * Get a single UserProfile by ID.
 */
const getOneById = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const UserProfile = await PetProfileService.getOneById(id);
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
  // const data = req.body;
  // const file = req.file as Express.Multer.File;

  const data = { ...req.body };
    if (req?.file) {
      data.image = storeFile('profile', req?.file?.filename);
    }

  const result = await PetProfileService.updateById(id, data);
  if (!result) throw new Error('UserProfile not found');
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

  const UserProfile = await PetProfileService.deleteById(id);
  if (!UserProfile) throw new Error('UserProfile not found');

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'UserProfile deleted successfully!',
    data: UserProfile,
  });
});

export const PetProfileController = {
  addNew,
  getAll,
  getOneById,
  updateById,
  deleteById,
};
