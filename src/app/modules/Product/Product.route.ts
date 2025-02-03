import express from 'express';
import auth from '../../middleware/auth';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constants';
import { ProductController } from './Product.controller';
import { productValidations } from './Product.validation';
const upload = fileUpload('./public/uploads/profile');
const router = express.Router();

router.post(
  '/add',
  auth(USER_ROLE.ADMIN), // Authorization middleware
  upload.single('file'),
  parseData(),
  // FileUploadHelper.upload.single('file'), // Single file uploads
  // (req: Request, res: Response, next: NextFunction) => {
  //   req.body = productValidations.addProductValidationSchema.parse(
  //     JSON.parse(req.body.data),
  //   );
  //   return ProductController.addNewProduct(req, res, next);
  // },
  // validateRequest(productValidations.addProductValidationSchema),
  ProductController.addNewProduct,
);

router.get('/', ProductController.getAllProducts);

router.get('/:id', ProductController.getProductById);

router.patch(
  '/:id',
  auth(USER_ROLE.ADMIN),
  // FileUploadHelper.upload.single('file'), // Single file uploads
  // (req: Request, res: Response, next: NextFunction) => {
  //   req.body = productValidations.updateProductValidationSchema.parse(
  //     JSON.parse(req.body.data),
  //   );
  //   return ProductController.updateProduct(req, res, next);
  // },
  upload.single('file'),
  parseData(),
  // validateRequest(productValidations.updateProductValidationSchema),
  ProductController.updateProduct,
);

router.delete(
  '/:id',
  auth(USER_ROLE.ADMIN), // Authorization middleware
  ProductController.deleteProduct,
);

export const ProductsRoutes = router;
