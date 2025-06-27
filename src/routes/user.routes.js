import express from 'express';
import {
  createUser,
  findByEmail,
  findBySocial,
  updateUser,
  getUser,
  deleteUser,
} from '../controllers/user.controller.js';
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

const router = express.Router();

router.get('/findByEmail', findByEmail);
router.get('/findBySocial', findBySocial);
router.post('/', createUser);

// Self-service routes
router.get('/', requireAuth, getUser); // get own profile
router.patch('/', requireAuth, updateUser); // update own profile, password, or deactivate
router.delete('/', requireAuth, deleteUser); // self-service delete own account

// Address management routes
router.get('/addresses', requireAuth, getAddresses);
router.post('/addresses', requireAuth, addAddress);
router.patch('/addresses/:addressId', requireAuth, updateAddress);
router.delete('/addresses/:addressId', requireAuth, removeAddress);

// Payment method management routes
router.get('/paymentmethods', requireAuth, getPaymentMethods);
router.post('/paymentmethods', requireAuth, addPaymentMethod);
router.patch('/paymentmethods/:paymentId', requireAuth, updatePaymentMethod);
router.delete('/paymentmethods/:paymentId', requireAuth, removePaymentMethod);

// Wishlist management routes
router.get('/wishlist', requireAuth, getWishlist);
router.post('/wishlist', requireAuth, addToWishlist);
router.patch('/wishlist/:wishlistId', requireAuth, updateWishlistItem);
router.delete('/wishlist/:wishlistId', requireAuth, removeFromWishlist);

export default router;
