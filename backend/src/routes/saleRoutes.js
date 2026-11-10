import { Router } from 'express';
import { cancel, create, index, show } from '../controllers/saleController.js';
import { authenticate } from '../middlewares/authenticate.js';

const router = Router();
router.use(authenticate);
router.get('/', index);
router.get('/:id', show);
router.post('/', create);
router.post('/:id/cancel', cancel);
export default router;
