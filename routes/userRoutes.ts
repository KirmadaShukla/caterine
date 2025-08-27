import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate, restrictTo } from '../middleware/auth';
import {
  validateUserRegistration,
  validateUserLogin,
  validatePasswordUpdate,
  validateMongoId,
  validatePagination,
} from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const userController = new UserController();

// Public routes (Authentication)
router.post('/register', authLimiter, validateUserRegistration, userController.register);
router.post('/login', authLimiter, validateUserLogin, userController.login);
router.post('/logout', userController.logout);

// Protected routes (require authentication)
router.use(authenticate); // All routes after this middleware require authentication

// User profile routes
router.get('/profile', userController.getProfile);
router.patch('/profile', userController.updateProfile);
router.delete('/profile', userController.deleteProfile);
router.patch('/update-password', validatePasswordUpdate, userController.updatePassword);

export default router;