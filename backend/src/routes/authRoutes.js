import { Router } from 'express';
import { login, me, setupAdmin, setupStatus } from '../controllers/authController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
router.get('/setup-status', setupStatus);
router.post('/setup-admin', setupAdmin);
router.post('/login', login);
router.get('/me', authenticate, me);
export default router;
