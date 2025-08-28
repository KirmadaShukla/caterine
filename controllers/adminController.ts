import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';
import { ImageService } from '../services/imageService';
import { catchAsync } from '../utils/catchAsync';
import { formatResponse } from '../utils/helpers';
import { AppError } from '../utils/appError';
import { AdminLoginInput, SiteSettingsInput } from '../types/admin';

export interface AuthenticatedAdminRequest extends Request {
  admin?: any;
}

export class AdminController {
  // Authentication routes
  login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const credentials: AdminLoginInput = req.body;
    
    const { admin, token } = await AdminService.loginAdmin(credentials);

    res.status(200).json(
      formatResponse('success', 'Admin login successful', {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          lastLoginAt: admin.lastLoginAt,
        },
      })
    );
  });

  logout = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json(
      formatResponse('success', 'Admin logged out successfully')
    );
  });

  // Admin profile management
  getProfile = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const admin = await AdminService.getAdminById(req.admin._id.toString());

    res.status(200).json(
      formatResponse('success', 'Admin profile retrieved successfully', { admin })
    );
  });

  // Site settings management
  getCurrentSettings = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const settings = await AdminService.getCurrentSiteSettings();

    res.status(200).json(
      formatResponse('success', 'Site settings retrieved successfully', { settings })
    );
  });

  // Update site settings
  updateSettings = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const updateData: SiteSettingsInput = req.body;
    const adminId = req.admin._id.toString();
    
    const settings = await AdminService.updateSiteSettings(adminId, updateData);

    res.status(200).json(
      formatResponse('success', 'Site settings updated successfully', { settings })
    );
  });

  getSettingsHistory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    
    const result = await AdminService.getSiteSettingsHistory(page, limit);

    res.status(200).json(
      formatResponse(
        'success',
        'Site settings history retrieved successfully',
        { 
          history: result.history,
          results: result.history.length 
        },
        {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        }
      )
    );
  });

  restoreSettings = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const adminId = req.admin._id.toString();
    
    const settings = await AdminService.restoreSiteSettings(adminId, id);

    res.status(200).json(
      formatResponse('success', 'Site settings restored successfully', { settings })
    );
  });

  // Utility method for creating initial admin (for setup)
  createInitialAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { name, email, password } = req.body;
    
    // Check if any admin already exists
    const existingAdmin = await AdminService.getAdminById('any').catch(() => null);
    if (existingAdmin) {
      return next(new AppError('Admin setup has already been completed', 400));
    }
    
    const { admin, token } = await AdminService.createAdmin(name, email, password);

    res.status(201).json(
      formatResponse('success', 'Initial admin created successfully', {
        token,
        admin: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
        },
      })
    );
  });

  // Background image upload handler
  uploadBackgroundImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    if (!req.files || !req.files.image) {
      return next(new AppError('Please upload an image file', 400));
    }

    const imageFile = req.files.image as any;
    const adminId = req.admin._id.toString();
    
    const settings = await AdminService.updateBackgroundImage(adminId, imageFile);

    res.status(200).json(
      formatResponse('success', 'Background image updated successfully', { settings })
    );
  });

  // Bulk update for hero section
  updateHeroSection = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { title, subtitle, buttonText } = req.body;
    
    const heroSectionText = {
      ...(title && { title }),
      ...(subtitle && { subtitle }),
      ...(buttonText && { buttonText }),
    };

    const adminId = req.admin._id.toString();
    const settings = await AdminService.updateSiteSettings(adminId, { heroSectionText });

    res.status(200).json(
      formatResponse('success', 'Hero section updated successfully', { settings })
    );
  });

  // Bulk update for about section
  updateAboutSection = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { title, content, mission, vision } = req.body;
    
    const aboutSectionText = {
      ...(title && { title }),
      ...(content && { content }),
      ...(mission && { mission }),
      ...(vision && { vision }),
    };

    const adminId = req.admin._id.toString();
    const settings = await AdminService.updateSiteSettings(adminId, { aboutSectionText });

    res.status(200).json(
      formatResponse('success', 'About section updated successfully', { settings })
    );
  });

  // About section image upload handler
  uploadAboutSectionImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    if (!req.files || !req.files.image) {
      return next(new AppError('Please upload an image file', 400));
    }

    const imageFile = req.files.image as any;
    const adminId = req.admin._id.toString();
    
    const settings = await AdminService.updateAboutSectionImage(adminId, imageFile);

    res.status(200).json(
      formatResponse('success', 'About section image updated successfully', { settings })
    );
  });

  // Remove background image
  removeBackgroundImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const adminId = req.admin._id.toString();
    const settings = await AdminService.removeBackgroundImage(adminId);

    res.status(200).json(
      formatResponse('success', 'Background image removed successfully', { settings })
    );
  });

  // Remove about section image
  removeAboutSectionImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const adminId = req.admin._id.toString();
    const settings = await AdminService.removeAboutSectionImage(adminId);

    res.status(200).json(
      formatResponse('success', 'About section image removed successfully', { settings })
    );
  });

  // Menu section controllers
  updateMenuMainText = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { title, content } = req.body;
    
    const menuMainText = {
      ...(title && { title }),
      ...(content && { content }),
    };

    const adminId = req.admin._id.toString();
    const settings = await AdminService.updateSiteSettings(adminId, { menuMainText });

    res.status(200).json(
      formatResponse('success', 'Menu main text updated successfully', { settings })
    );
  });

  uploadMenuMainImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    if (!req.files || !req.files.image) {
      return next(new AppError('Please upload an image file', 400));
    }

    const imageFile = req.files.image as any;
    const adminId = req.admin._id.toString();
    
    const settings = await AdminService.updateMenuMainImage(adminId, imageFile);

    res.status(200).json(
      formatResponse('success', 'Menu main image updated successfully', { settings })
    );
  });

  removeMenuMainImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const adminId = req.admin._id.toString();
    const settings = await AdminService.removeMenuMainImage(adminId);

    res.status(200).json(
      formatResponse('success', 'Menu main image removed successfully', { settings })
    );
  });

  addMenuChildItem = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { title, content, price } = req.body;
    
    if (!title || !content || price === undefined) {
      return next(new AppError('Title, content, and price are required', 400));
    }

    const adminId = req.admin._id.toString();
    
    // Handle image upload if present
    let imageData = null;
    if (req.files && req.files.image) {
      const imageFile = req.files.image as any;
      const uploadResult = await ImageService.uploadImage(imageFile, 'caterine/menu-items');
      imageData = {
        url: uploadResult.url,
        fileId: uploadResult.fileId,
      };
    }

    const settings = await AdminService.addMenuChildItem(adminId, { title, content, price, image: imageData });

    res.status(200).json(
      formatResponse('success', 'Menu item added successfully', { settings })
    );
  });

  updateMenuChildItem = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { itemIndex } = req.params;
    const { title, content, price } = req.body;
    
    const index = parseInt(itemIndex);
    if (isNaN(index) || index < 0) {
      return next(new AppError('Invalid item index', 400));
    }

    const adminId = req.admin._id.toString();
    
    // Handle image upload if present
    let imageData = undefined;
    if (req.files && req.files.image) {
      const imageFile = req.files.image as any;
      const uploadResult = await ImageService.uploadImage(imageFile, 'caterine/menu-items');
      imageData = {
        url: uploadResult.url,
        fileId: uploadResult.fileId,
      };
    }

    const settings = await AdminService.updateMenuChildItem(adminId, index, { title, content, price, image: imageData });

    res.status(200).json(
      formatResponse('success', 'Menu item updated successfully', { settings })
    );
  });

  uploadMenuChildImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { itemIndex } = req.params;
    
    if (!req.files || !req.files.image) {
      return next(new AppError('Please upload an image file', 400));
    }

    const index = parseInt(itemIndex);
    if (isNaN(index) || index < 0) {
      return next(new AppError('Invalid item index', 400));
    }

    const imageFile = req.files.image as any;
    const adminId = req.admin._id.toString();
    
    const settings = await AdminService.updateMenuChildImage(adminId, index, imageFile);

    res.status(200).json(
      formatResponse('success', 'Menu item image updated successfully', { settings })
    );
  });

  removeMenuChildImage = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { itemIndex } = req.params;
    
    const index = parseInt(itemIndex);
    if (isNaN(index) || index < 0) {
      return next(new AppError('Invalid item index', 400));
    }

    const adminId = req.admin._id.toString();
    const settings = await AdminService.removeMenuChildImage(adminId, index);

    res.status(200).json(
      formatResponse('success', 'Menu item image removed successfully', { settings })
    );
  });

  deleteMenuChildItem = catchAsync(async (req: AuthenticatedAdminRequest, res: Response, next: NextFunction) => {
    const { itemIndex } = req.params;
    
    const index = parseInt(itemIndex);
    if (isNaN(index) || index < 0) {
      return next(new AppError('Invalid item index', 400));
    }

    const adminId = req.admin._id.toString();
    const settings = await AdminService.deleteMenuChildItem(adminId, index);

    res.status(200).json(
      formatResponse('success', 'Menu item deleted successfully', { settings })
    );
  });
}