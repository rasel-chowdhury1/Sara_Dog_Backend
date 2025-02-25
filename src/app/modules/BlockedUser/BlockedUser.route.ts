import { Router } from "express";
import { BlockedUserController } from "./Blocked.controller";
import auth from "../../middleware/auth";
import { USER_ROLE } from "../user/user.constants";


const router = Router();

router.post(
  '/block/:blockUserId',
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  BlockedUserController.blockUser,
);

router.post(
  '/unblock/:blockUserId',
  auth(USER_ROLE.ADMIN, USER_ROLE.USER),
  BlockedUserController.unBlockUser,
);

router.get(
    '/', 
    auth(USER_ROLE.ADMIN, USER_ROLE.USER),
    BlockedUserController.getBlockedUsers);

export const blockedUserRoutes= router;
