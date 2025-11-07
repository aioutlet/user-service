import express from 'express';
import {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  getUserStats,
  getRecentUsers,
} from '../controllers/admin.controller.js';
import { requireAuth, requireAdmin } from '../middlewares/auth.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireAdmin);

// Specific routes must come before parameterized routes
router.get('/stats', getUserStats); // GET /admin/users/stats
router.get('/list/recent', getRecentUsers); // GET /admin/users/list/recent

// General routes
router.get('/', getUsers); // GET /admin/users
router.post('/', createUser); // POST /admin/users
router.get('/:id', getUser); // GET /admin/users/:id
router.patch('/:id', updateUser); // PATCH /admin/users/:id
router.delete('/:id', deleteUser); // DELETE /admin/users/:id

export default router;
