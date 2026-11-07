import { Router } from 'express';
import { categories, create, index, lowStock, remove, update } from '../controllers/productController.js';
import { allowRoles, authenticate } from '../middlewares/authenticate.js';

const router = Router();
router.get('/', index);
router.get('/low-stock', lowStock);
router.get('/categories', categories);
router.post('/', authenticate, allowRoles('admin'), create);
router.put('/:id', authenticate, allowRoles('admin'), update);
router.delete('/:id', authenticate, allowRoles('admin'), remove);
export default router;
