import { Router } from 'express';
import { checkout, config, syncPayment, webhook } from '../controllers/paymentController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
router.post('/webhook', webhook);
router.get('/config', authenticate, config);
router.post('/checkout', authenticate, checkout);
router.post('/sync', authenticate, syncPayment);
export default router;
