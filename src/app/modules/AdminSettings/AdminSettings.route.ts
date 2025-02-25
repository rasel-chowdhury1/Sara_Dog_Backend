import { Router } from "express";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";
import { AdminSettingsController } from "./AdminSettings.controller";

const router = Router();

router
  .get('/settings', AdminSettingsController.getSettings)

  .patch(
    '/settings',
    auth(
      USER_ROLE.ADMIN
    ),
    AdminSettingsController.updateSettings
  );

export const AdminSettingsRouter = router;
