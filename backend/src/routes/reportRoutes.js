import { Router } from 'express';
import { summary } from '../controllers/reportController.js';
import { authenticate } from '../middlewares/authenticate.js';
const router = Router(); router.get('/summary', authenticate, summary); export default router;
