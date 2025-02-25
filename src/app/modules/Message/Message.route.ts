import { Router } from 'express';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import { MessageController } from './Message.controller';
const upload = fileUpload('./public/uploads/message');

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

router.post(
  '/uploadImage',
  upload.single('file'),
  MessageController.uploadImageForSendMessage
);

router.get('/full-chat/:chatId', MessageController.GetChatMessages);

router.patch('/read', MessageController.ReadAllMessages);

export const MessageRoutes = router;
