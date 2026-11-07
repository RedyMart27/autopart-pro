import { Router } from 'express';
import { create, index, remove, update } from '../controllers/customerController.js';
import { authenticate, allowRoles } from '../middlewares/authenticate.js';

const router = Router();
router.use(authenticate);
router.get('/', index);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', allowRoles('admin'), remove);
export default router;
