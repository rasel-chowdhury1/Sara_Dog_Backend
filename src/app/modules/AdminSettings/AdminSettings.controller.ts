import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import httpStatus from 'http-status';
import { AdminSettingsService } from "./AdminSettings.service";

const getSettings = catchAsync(async (req: Request, res: Response) => {
  const result = await AdminSettingsService.getSettings();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Admin settings fetched successfully!',
    data: result,
  });
});



const updateSettings = catchAsync(
  async (req: Request, res: Response) => {
    const settingsData = req.body;


    const result = await AdminSettingsService.updateSettings(settingsData);
    sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'Admin settings updated successfully!',
      data: result,
    });
  },
);



export const AdminSettingsController = {
    getSettings,
    updateSettings
}