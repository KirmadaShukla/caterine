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

      // Validate file object
      if (!file) {
        throw new AppError('No file uploaded', 400);
      }
      
      if (!file.name || !file.mimetype || !file.size) {
        throw new AppError('Invalid file information', 400);
      }
      
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
      
      // For direct upload from memory, we need to convert the file data to base64
      // Note: This requires Cloudinary's SDK to support base64 uploads
      if (!file.data) {
        throw new AppError('File data not available', 500);
      }
      
      // Convert buffer to base64
      const base64Data = file.data.toString('base64');
      
      // Upload to Cloudinary using base64 data
      const uploadResult = await cloudinary.uploader.upload(`data:${file.mimetype};base64,${base64Data}`, {
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
      // Log more detailed error information for debugging
      console.error('Cloudinary upload error details:', {
        error: error,
        errorMessage: error.message,
        errorStack: error.stack,
        file: {
          name: file.name,
          size: file.size,
          mimetype: file.mimetype,
          hasData: !!file.data
        }
      });
      
      if (error instanceof AppError) {
        throw error;
      }
      
      // Add more specific error messages based on Cloudinary error codes if available
      const errorMessage = error.http_code === 401 
        ? 'Cloudinary authentication failed. Please check your Cloudinary credentials.'
        : error.message || 'Image upload failed';
        
      throw new AppError(errorMessage, error.http_code || 500);
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