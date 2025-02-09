import AppError from "../../error/AppError";
import { AdminSettings } from "./AdminSettings.model";
import httpStatus from 'http-status';

const getSettings = async () => {
  const settings = await AdminSettings.findOne();

  if (!settings) {
    throw new AppError(httpStatus.NOT_FOUND, 'Admin settings not found');
  }

  return settings;
};

const updateSettings = async (data: any) => {
  let settings = await AdminSettings.findOne();

  if (!settings) {
    // If settings don't exist, create a new one
    settings = new AdminSettings(data);
  } else {
    // If settings exist, update the existing document
    Object.assign(settings, data);
  }

  const result = await settings.save();

//   console.log('====== Admin settings updated data ===== >>> ', result);

  if (!result) {
    throw new AppError(
      httpStatus.INTERNAL_SERVER_ERROR,
      'Admin settings update failed',
    );
  }

  return result;
};


export const AdminSettingsService = {
  getSettings,
  updateSettings,
};