import bcrypt from 'bcryptjs';
import Admin, { IAdmin } from '../models/Admin';
import SiteSettings, { ISiteSettings } from '../models/SiteSettings';
import { AppError } from '../utils/appError';
import { signToken } from '../utils/helpers';
import config from '../config/env';
import { AdminLoginInput, SiteSettingsInput } from '../types/admin';
import { ImageService, ImageUploadResult } from './imageService';
import { UploadedFile } from 'express-fileupload';

export class AdminService {
  /**
   * Authenticate admin login
   */
  static async loginAdmin(credentials: AdminLoginInput): Promise<{ admin: IAdmin; token: string }> {
    const { email, password } = credentials;

    // Check if admin exists and password is correct - bypass pre-find middleware
    const admin = await Admin.findOne({ email, active: { $ne: false } }).select('+password +active');
    
    if (!admin || !(await admin.correctPassword(password, admin.password))) {
      throw new AppError('Incorrect email or password', 401);
    }
    console.log(admin)
    // Check if admin is active


    // Update last login
    admin.lastLoginAt = new Date();
    await admin.save({ validateBeforeSave: false });

    // Generate JWT token
    const token = signToken((admin._id as any).toString());

    return { admin, token };
  }

  /**
   * Get admin by ID
   */
  static async getAdminById(id: string): Promise<IAdmin> {
    const admin = await Admin.findById(id);
    
    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    return admin;
  }

  /**
   * Create default admin (for initial setup)
   */
  static async createAdmin(
    name: string, 
    email: string, 
    password: string
  ): Promise<{ admin: IAdmin; token: string }> {
    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      throw new AppError('Admin with this email already exists', 400);
    }

    // Create admin (password will be hashed by pre-save middleware)
    const admin = await Admin.create({
      name,
      email,
      password,
      active: true, // Explicitly set active to true
    });

    // Generate JWT token
    const token = signToken((admin._id as any).toString());

    return { admin, token };
  }

  /**
   * Get current site settings
   */
  static async getCurrentSiteSettings(): Promise<ISiteSettings> {
    let settings = await SiteSettings.findOne({ isActive: true }).populate('updatedBy', 'name email');
    
    // If no active settings exist, create default ones
    if (!settings) {
      // Create a default admin for initial setup if none exists
      let defaultAdmin = await Admin.findOne();
      if (!defaultAdmin) {
        defaultAdmin = await Admin.create({
          name: 'Default Admin',
          email: 'admin@example.com',
          password: 'defaultpassword123', // Should be changed on first login
        });
      }

      settings = await SiteSettings.create({
        backgroundImage: {
          url: 'default-bg.jpg',
          fileId: null,
        },
        heroSectionText: {
          title: 'Welcome to Our Website',
          subtitle: 'Discover amazing features and services that will help you grow your business.',
          buttonText: 'Get Started',
        },
        aboutSectionText: {
          title: 'About Us',
          content: 'We are a dedicated team committed to providing excellent services and solutions for our clients.',
          mission: 'Our mission is to deliver innovative solutions that exceed expectations.',
          vision: 'To be the leading provider of cutting-edge technology solutions.',
        },
        aboutSectionImage: {
          url: null,
          fileId: null,
        },
        contactInfo: {
          email: 'contact@example.com',
          phone: '+1 (555) 123-4567',
          address: '123 Business Street, City, State 12345',
        },
        updatedBy: defaultAdmin._id,
      });

      await settings.populate('updatedBy', 'name email');
    }

    return settings;
  }

  /**
   * Update site settings
   */
  static async updateSiteSettings(
    adminId: string,
    updateData: SiteSettingsInput
  ): Promise<ISiteSettings> {
    // Get current active settings
    let settings = await SiteSettings.findOne({ isActive: true });

    if (settings) {
      // Update existing settings
      Object.keys(updateData).forEach(key => {
        const value = updateData[key as keyof SiteSettingsInput];
        if (value !== undefined) {
          if (typeof value === 'object' && value !== null) {
            // Handle nested objects (heroSectionText, aboutSectionText, etc.)
            const currentValue = settings![key as keyof ISiteSettings];
            if (typeof currentValue === 'object' && currentValue !== null) {
              (settings as any)[key] = {
                ...currentValue,
                ...value
              };
            }
          } else {
            // Handle primitive values
            (settings as any)[key] = value;
          }
        }
      });

      settings.updatedBy = adminId as any;
      await settings.save();
    } else {
      // Create new settings
      settings = await SiteSettings.create({
        ...updateData,
        updatedBy: adminId,
      });
    }

    await settings.populate('updatedBy', 'name email');
    return settings;
  }

  /**
   * Get site settings history (previous versions)
   */
  static async getSiteSettingsHistory(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const history = await SiteSettings.find()
      .populate('updatedBy', 'name email')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await SiteSettings.countDocuments();
    const totalPages = Math.ceil(total / limit);

    return {
      history,
      total,
      page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Restore previous site settings version
   */
  static async restoreSiteSettings(
    adminId: string,
    settingsId: string
  ): Promise<ISiteSettings> {
    const previousSettings = await SiteSettings.findById(settingsId);
    
    if (!previousSettings) {
      throw new AppError('Settings version not found', 404);
    }

    // Deactivate all current settings
    await SiteSettings.updateMany({}, { isActive: false });

    // Create new active settings based on previous version
    const restoredSettings = await SiteSettings.create({
      backgroundImage: previousSettings.backgroundImage,
      heroSectionText: previousSettings.heroSectionText,
      aboutSectionText: previousSettings.aboutSectionText,
      contactInfo: previousSettings.contactInfo,
      socialMedia: previousSettings.socialMedia,
      updatedBy: adminId,
      isActive: true,
    });

    await restoredSettings.populate('updatedBy', 'name email');
    return restoredSettings;
  }

  /**
   * Upload and update background image
   */
  static async updateBackgroundImage(
    adminId: string,
    file: UploadedFile
  ): Promise<ISiteSettings> {
    // Validate file
    ImageService.validateImageFile(file);

    // Get current settings
    const settings = await SiteSettings.findOne({ isActive: true });
    if (!settings) {
      throw new AppError('Site settings not found', 404);
    }

    // Delete previous image if it exists
    if (settings.backgroundImage?.fileId) {
      await ImageService.deleteImage(settings.backgroundImage.fileId);
    }

    // Upload new image
    const uploadResult = await ImageService.uploadBackgroundImage(file);

    // Update settings
    settings.backgroundImage = {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
    };
    settings.updatedBy = adminId as any;
    await settings.save();

    await settings.populate('updatedBy', 'name email');
    return settings;
  }

  /**
   * Upload and update about section image
   */
  static async updateAboutSectionImage(
    adminId: string,
    file: UploadedFile
  ): Promise<ISiteSettings> {
    // Validate file
    ImageService.validateImageFile(file);

    // Get current settings
    const settings = await SiteSettings.findOne({ isActive: true });
    if (!settings) {
      throw new AppError('Site settings not found', 404);
    }

    // Delete previous image if it exists
    if (settings.aboutSectionImage?.fileId) {
      await ImageService.deleteImage(settings.aboutSectionImage.fileId);
    }

    // Upload new image
    const uploadResult = await ImageService.uploadAboutSectionImage(file);

    // Update settings
    settings.aboutSectionImage = {
      url: uploadResult.url,
      fileId: uploadResult.fileId,
    };
    settings.updatedBy = adminId as any;
    await settings.save();

    await settings.populate('updatedBy', 'name email');
    return settings;
  }

  /**
   * Remove background image
   */
  static async removeBackgroundImage(adminId: string): Promise<ISiteSettings> {
    const settings = await SiteSettings.findOne({ isActive: true });
    if (!settings) {
      throw new AppError('Site settings not found', 404);
    }

    // Delete image from Cloudinary if it exists
    if (settings.backgroundImage?.fileId) {
      await ImageService.deleteImage(settings.backgroundImage.fileId);
    }

    // Reset to default
    settings.backgroundImage = {
      url: 'default-bg.jpg',
      fileId: null,
    };
    settings.updatedBy = adminId as any;
    await settings.save();

    await settings.populate('updatedBy', 'name email');
    return settings;
  }

  /**
   * Remove about section image
   */
  static async removeAboutSectionImage(adminId: string): Promise<ISiteSettings> {
    const settings = await SiteSettings.findOne({ isActive: true });
    if (!settings) {
      throw new AppError('Site settings not found', 404);
    }

    // Delete image from Cloudinary if it exists
    if (settings.aboutSectionImage?.fileId) {
      await ImageService.deleteImage(settings.aboutSectionImage.fileId);
    }

    // Reset to null
    settings.aboutSectionImage = {
      url: null,
      fileId: null,
    };
    settings.updatedBy = adminId as any;
    await settings.save();

    await settings.populate('updatedBy', 'name email');
    return settings;
  }
}