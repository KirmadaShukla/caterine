import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticateAdmin } from '../middleware/adminAuth';
import {
  validateAdminLogin,
  validateAdminCreation,
  validateSiteSettings,
  validateMongoId,
  validatePagination,

} from '../middleware/validation';
import { authLimiter } from '../middleware/rateLimiter';

const router = Router();
const adminController = new AdminController();

// Initial setup route (only works if no admin exists)
router.post('/setup', validateAdminCreation, adminController.createInitialAdmin);

// Public routes (Authentication)
router.post('/login', authLimiter, validateAdminLogin, adminController.login);
router.post('/logout', adminController.logout);

// Protected routes (require admin authentication)
router.use(authenticateAdmin); // All routes after this middleware require admin authentication

// Admin profile routes
router.get('/profile', adminController.getProfile);

// Site settings routes
router.get('/settings', adminController.getCurrentSettings);
router.put('/settings', validateSiteSettings, adminController.updateSettings);

// Site settings history
router.get('/settings/history', validatePagination, adminController.getSettingsHistory);
router.post('/settings/restore/:id', validateMongoId, adminController.restoreSettings);

// Specific content update routes
router.put('/settings/background-image', adminController.uploadBackgroundImage);
router.delete('/settings/background-image', adminController.removeBackgroundImage);
router.put('/settings/hero-section', adminController.updateHeroSection);
router.put('/settings/about-section', adminController.updateAboutSection);
router.put('/settings/about-section-image', adminController.uploadAboutSectionImage);
router.delete('/settings/about-section-image', adminController.removeAboutSectionImage);

// Social medial route
// router.post('/update-link',adminController.updateSocialMediaLinks)
export default router;