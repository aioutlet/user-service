import express from 'express';
import { createUser, findByEmail, updateUser, getUser, deleteUser } from '../controllers/user.controller.js';
import { getAddresses, addAddress, updateAddress, removeAddress } from '../controllers/user.address.controller.js';
import {
  getPaymentMethods,
  addPaymentMethod,
  updatePaymentMethod,
  removePaymentMethod,
} from '../controllers/user.payment.controller.js';
import {
  getWishlist,
  addToWishlist,
  updateWishlistItem,
  removeFromWishlist,
} from '../controllers/user.wishlist.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import rateLimitMiddleware from '../middlewares/rateLimit.middleware.js';

const {
  profileRateLimit,
  userCreationRateLimit,
  addressManagementRateLimit,
  paymentManagementRateLimit,
  wishlistRateLimit,
  userLookupRateLimit,
  sensitiveOperationsSlowDown,
} = rateLimitMiddleware;

const router = express.Router();

router.get('/findByEmail', userLookupRateLimit, findByEmail);
router.post('/', userCreationRateLimit, sensitiveOperationsSlowDown, createUser);

// Self-service routes
router.get('/', requireAuth, profileRateLimit, getUser); // get own profile
router.patch('/', requireAuth, profileRateLimit, sensitiveOperationsSlowDown, updateUser); // update own profile, password, or deactivate
router.delete('/', requireAuth, profileRateLimit, sensitiveOperationsSlowDown, deleteUser); // self-service delete own account

// Address management routes
router.get('/addresses', requireAuth, addressManagementRateLimit, getAddresses);
router.post('/addresses', requireAuth, addressManagementRateLimit, addAddress);
router.patch('/addresses/:addressId', requireAuth, addressManagementRateLimit, updateAddress);
router.delete('/addresses/:addressId', requireAuth, addressManagementRateLimit, removeAddress);

// Payment method management routes
router.get('/paymentmethods', requireAuth, paymentManagementRateLimit, getPaymentMethods);
router.post('/paymentmethods', requireAuth, paymentManagementRateLimit, sensitiveOperationsSlowDown, addPaymentMethod);
router.patch(
  '/paymentmethods/:paymentId',
  requireAuth,
  paymentManagementRateLimit,
  sensitiveOperationsSlowDown,
  updatePaymentMethod
);
router.delete(
  '/paymentmethods/:paymentId',
  requireAuth,
  paymentManagementRateLimit,
  sensitiveOperationsSlowDown,
  removePaymentMethod
);

// Wishlist management routes
router.get('/wishlist', requireAuth, wishlistRateLimit, getWishlist);
router.post('/wishlist', requireAuth, wishlistRateLimit, addToWishlist);
router.patch('/wishlist/:wishlistId', requireAuth, wishlistRateLimit, updateWishlistItem);
router.delete('/wishlist/:wishlistId', requireAuth, wishlistRateLimit, removeFromWishlist);

export default router;
