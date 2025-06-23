import express from 'express';
import {
  createUser,
  findByEmail,
  findBySocial,
  updateUser,
  getUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.get('/findByEmail', findByEmail);
router.get('/findBySocial', findBySocial);
router.post('/', createUser);

// Self-service routes
router.get('/', requireAuth, getUser); // get own profile
router.patch('/', requireAuth, updateUser); // update own profile, password, or deactivate
router.delete('/', requireAuth, deleteUser); // self-service delete own account

export default router;
