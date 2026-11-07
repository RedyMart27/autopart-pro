import { Router } from 'express';
import { index } from '../controllers/vehicleController.js';
const router = Router(); router.get('/', index); export default router;
