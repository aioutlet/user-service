import express from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/admin.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireRole('admin'));

router.get('/', getUsers); // GET /admin/users
router.get('/:id', getUser); // GET /admin/users/:id
router.patch('/:id', updateUser); // PATCH /admin/users/:id
router.delete('/:id', deleteUser); // DELETE /admin/users/:id

export default router;
