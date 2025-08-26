import { UploadedFile } from 'express-fileupload';
import cloudinary from '../config/cloudinary';
import { AppError } from '../utils/appError';
import config from '../config/env';

export interface ImageUploadResult {
  url: string;
  fileId: string;
}

export class ImageService {
  /**
   * Upload image to Cloudinary
   */
  static async uploadImage(
    file: UploadedFile,
    folder: string = 'caterine'
  ): Promise<ImageUploadResult> {
    try {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.mimetype)) {
        throw new AppError('Only JPEG, PNG, and WebP images are allowed', 400);
      }

      // Validate file size
      if (file.size > config.fileUpload.maxFileSize) {
        throw new AppError(
          `File size too large. Maximum size is ${config.fileUpload.maxFileSize / 1024 / 1024}MB`,
          400
        );
      }

      // Upload to Cloudinary
      const uploadResult = await cloudinary.uploader.upload(file.tempFilePath, {
        folder: folder,
        resource_type: 'image',
        transformation: [
          { quality: 'auto' },
          { fetch_format: 'auto' }
        ]
      });

      return {
        url: uploadResult.secure_url,
        fileId: uploadResult.public_id,
      };
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError(`Image upload failed: ${error.message}`, 500);
    }
  }

  /**
   * Delete image from Cloudinary
   */
  static async deleteImage(fileId: string): Promise<void> {
    try {
      if (!fileId) return;

      await cloudinary.uploader.destroy(fileId);
    } catch (error: any) {
      // Log error but don't throw - deletion failures shouldn't break the update
      console.error(`Failed to delete image from Cloudinary: ${error.message}`);
    }
  }

  /**
   * Upload background image
   */
  static async uploadBackgroundImage(file: UploadedFile): Promise<ImageUploadResult> {
    return this.uploadImage(file, 'caterine/backgrounds');
  }

  /**
   * Upload about section image
   */
  static async uploadAboutSectionImage(file: UploadedFile): Promise<ImageUploadResult> {
    return this.uploadImage(file, 'caterine/about');
  }

  /**
   * Validate uploaded file
   */
  static validateImageFile(file: any): file is UploadedFile {
    if (!file) {
      throw new AppError('No file uploaded', 400);
    }

    if (Array.isArray(file)) {
      throw new AppError('Multiple files not allowed', 400);
    }

    return true;
  }
}