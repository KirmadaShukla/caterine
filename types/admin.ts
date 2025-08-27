import { Document } from 'mongoose';

export interface IAdminBase {
  name: string;
  email: string;
  active: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminLoginInput {
  email: string;
  password: string;
}

export interface AdminAuthResponse {
  status: string;
  token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    lastLoginAt?: Date;
  };
}

export interface SiteSettingsInput {
  backgroundImage?: {
    url: string;
    fileId?: string | null;
  };
  heroSectionText?: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
  };
  aboutSectionText?: {
    title?: string;
    content?: string;
    mission?: string;
    vision?: string;
  };
  aboutSectionImage?: {
    url?: string | null;
    fileId?: string | null;
  };
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface SiteSettingsResponse {
  status: string;
  message: string;
  data: {
    settings: {
      id: string;
      backgroundImage: {
        url: string;
        fileId?: string | null;
      };
      heroSectionText: {
        title: string;
        subtitle: string;
        buttonText?: string;
      };
      aboutSectionText: {
        title: string;
        content: string;
        mission?: string;
        vision?: string;
      };
      aboutSectionImage?: {
        url?: string | null;
        fileId?: string | null;
      };
      contactInfo?: {
        email?: string;
        phone?: string;
        address?: string;
      };
      socialMedia?: {
        facebook?: string;
        twitter?: string;
        instagram?: string;
        linkedin?: string;
      };
      updatedAt: Date;
      updatedBy: string;
    };
  };
}