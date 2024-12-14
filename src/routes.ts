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

router.post('/personal-info', authMiddleware, QuestionaireController.savePersonalInfo);
router.put('/personal-info', authMiddleware, QuestionaireController.updatePersonalInfo);

router.post('/user/:userId/plan', authMiddleware, PlanningController.createPlan);
router.put('/user/:userId/plan', authMiddleware, PlanningController.updatePlan);
router.get('/plan/:planId', authMiddleware, PlanningController.getPlan);
router.post('/user/:userId/habit', authMiddleware, PlanningController.createHabit);
router.put('/user/:userId/habit', authMiddleware, PlanningController.updateHabit);
router.get('/habit/:habitId', authMiddleware, PlanningController.getHabit);

export default router;