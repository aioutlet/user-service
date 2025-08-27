import express from 'express';
import { getUsers, getUser, updateUser, deleteUser } from '../controllers/admin.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';
import rateLimitMiddleware from '../middlewares/rateLimit.middleware.js';

const { adminRateLimit, sensitiveOperationsSlowDown } = rateLimitMiddleware;

const router = express.Router();

// All admin routes require authentication and admin role
router.use(requireAuth, requireRole('admin'), adminRateLimit);

router.get('/', getUsers); // GET /admin/users
router.get('/:id', getUser); // GET /admin/users/:id
router.patch('/:id', sensitiveOperationsSlowDown, updateUser); // PATCH /admin/users/:id
router.delete('/:id', sensitiveOperationsSlowDown, deleteUser); // DELETE /admin/users/:id

export default router;
