import { Router } from 'express';
import AuthController from './controllers/AuthController';
import UserController from './controllers/UserController';
import authMiddleware from './middlewares/authMiddleware';
import QuestionaireController from './controllers/QuestionaireController';
import PlanningController from './controllers/PlanningController';

const router: Router = Router();

router.post('/auth', AuthController.authenticate);
router.post('/reset-passwd', UserController.resetPassword);
router.post('/change-passwd', authMiddleware, UserController.changePasswd);
router.post('/user', UserController.create);

router.post('/save-personal-info', authMiddleware, QuestionaireController.savePersonalInfo);

router.post('/create-plan', authMiddleware, PlanningController.createPlan);
router.get('/get-plan', authMiddleware, PlanningController.getPlan);

export default router;