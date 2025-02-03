import { NextFunction, Request, Response, Router } from 'express';
import { FileUploadHelper } from '../../helpers/fileUploadHelpers';
import validateRequest from '../../middleware/validateRequest';
import { MessageController } from './Message.controller';
import { MessageValidations } from './Message.validation';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
const upload = fileUpload('../../../public/uploads/profile');

const router = Router();

// router.post('/add-message', MessageController.SendNewMessage);

router.post(
  '/add-message',
  upload.single('file'),
  parseData(),
  // auth(USER_ROLE.ADMIN), // Authorization middleware
  // FileUploadHelper.upload.single('file'), // Single file uploads
  // (req: Request, res: Response, next: NextFunction) => {
  //   req.body = MessageValidations.addMessageValidationSchema.parse(
  //     JSON.parse(req.body.data),
  //   );

  //   return MessageController.SendNewMessage(req, res, next);
  // },
  // validateRequest(MessageValidations.addMessageValidationSchema),
  MessageController.SendNewMessage,
);

router.get('/full-chat/:chatId', MessageController.GetChatMessages);


router.patch('/read', MessageController.ReadAllMessages);

export const MessageRoutes = router;
