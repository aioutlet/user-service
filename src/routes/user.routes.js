import express from 'express';
import {
  createUser,
  findByEmail,
  findBySocial,
  updatePassword,
  updateUser,
  deactivateAccount,
  getUserById,
  updateUserById,
  deleteUser,
  deleteUserById,
} from '../controllers/user.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

router.get('/findByEmail', findByEmail);
router.get('/findBySocial', findBySocial);
router.post('/', createUser);

// Self-service routes (no :id in path)
router.get('/', requireAuth, getUserById); // get own profile
router.patch('/', requireAuth, updateUser); // update own profile
router.post('/password/change', requireAuth, updatePassword); // change own password
router.post('/account/deactivate', requireAuth, deactivateAccount); // deactivate own account
router.delete('/', requireAuth, deleteUser); // self-service delete own account

// Admin-only: update any user by ID (including isActive)
router.patch('/:id', requireAuth, requireRole('admin'), updateUserById); // admin can update any user
router.post('/:id/password/change', requireAuth, requireRole('admin'), updatePassword); // admin can change any user's password
router.delete('/:id', requireAuth, requireRole('admin'), deleteUserById); // admin delete any user

export default router;
