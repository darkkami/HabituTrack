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
router.put('/update-personal-info', authMiddleware, QuestionaireController.updatePersonalInfo);

router.post('/create-plan/:userId', authMiddleware, PlanningController.createPlan);
router.put('/update-plan/:userId', authMiddleware, PlanningController.updatePlan);
router.get('/get-plan/:planId', authMiddleware, PlanningController.getPlan);
router.post('/create-habit/:userId', authMiddleware, PlanningController.createHabit);
router.put('/update-habit/:userId', authMiddleware, PlanningController.updateHabit);
router.get('/get-habit/:habitId', authMiddleware, PlanningController.getHabit);

export default router;