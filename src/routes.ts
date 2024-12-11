import { Router } from 'express';
import AuthController from './controllers/AuthController';
import UserController from './controllers/UserController';
import authMiddleware from './middlewares/authMiddleware';
import QuestionaireController from './controllers/QuestionaireController';

const router: Router = Router();

router.post('/auth', AuthController.authenticate);
router.post('/reset-passwd', UserController.resetPassword);
router.post('/change-passwd', authMiddleware, UserController.changePasswd);
router.post('/user', UserController.create);

router.get('/aitest', authMiddleware, QuestionaireController.init);

export default router;