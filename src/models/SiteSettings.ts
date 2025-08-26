import mongoose, { Schema, Document } from 'mongoose';

export interface ISiteSettings extends Document {
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
    url: string | null;
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
  isActive: boolean;
  updatedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const siteSettingsSchema = new Schema<ISiteSettings>(
  {
    backgroundImage: {
      url: {
        type: String,
        required: [true, 'Background image URL is required'],
        default: 'default-bg.jpg',
      },
      fileId: {
        type: String,
        default: null,
      },
    },
    heroSectionText: {
      title: {
        type: String,
        required: [true, 'Hero section title is required'],
        trim: true,
        maxlength: [100, 'Hero title cannot be longer than 100 characters'],
      },
      subtitle: {
        type: String,
        required: [true, 'Hero section subtitle is required'],
        trim: true,
        maxlength: [200, 'Hero subtitle cannot be longer than 200 characters'],
      },
      buttonText: {
        type: String,
        trim: true,
        maxlength: [30, 'Button text cannot be longer than 30 characters'],
        default: 'Get Started',
      },
    },
    aboutSectionText: {
      title: {
        type: String,
        required: [true, 'About section title is required'],
        trim: true,
        maxlength: [100, 'About title cannot be longer than 100 characters'],
      },
      content: {
        type: String,
        required: [true, 'About section content is required'],
        trim: true,
        maxlength: [1000, 'About content cannot be longer than 1000 characters'],
      },
      mission: {
        type: String,
        trim: true,
        maxlength: [500, 'Mission text cannot be longer than 500 characters'],
      },
      vision: {
        type: String,
        trim: true,
        maxlength: [500, 'Vision text cannot be longer than 500 characters'],
      },
    },
    aboutSectionImage: {
      url: {
        type: String,
        default: null,
      },
      fileId: {
        type: String,
        default: null,
      },
    },
    contactInfo: {
      email: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            return !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
          },
          message: 'Please provide a valid email address'
        }
      },
      phone: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            return !value || /^\+?[\d\s\-()]{7,20}$/.test(value);
          },
          message: 'Please provide a valid phone number'
        }
      },
      address: {
        type: String,
        trim: true,
        maxlength: [200, 'Address cannot be longer than 200 characters'],
      },
    },
    socialMedia: {
      facebook: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            return !value || /^https?:\/\/(www\.)?facebook\.com\/.*/.test(value);
          },
          message: 'Please provide a valid Facebook URL'
        }
      },
      twitter: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            return !value || /^https?:\/\/(www\.)?(twitter|x)\.com\/.*/.test(value);
          },
          message: 'Please provide a valid Twitter/X URL'
        }
      },
      instagram: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            return !value || /^https?:\/\/(www\.)?instagram\.com\/.*/.test(value);
          },
          message: 'Please provide a valid Instagram URL'
        }
      },
      linkedin: {
        type: String,
        trim: true,
        validate: {
          validator: function(value: string) {
            return !value || /^https?:\/\/(www\.)?linkedin\.com\/.*/.test(value);
          },
          message: 'Please provide a valid LinkedIn URL'
        }
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
      required: [true, 'Updated by admin is required'],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        if (ret.__v !== undefined) ret.__v = undefined;
        return ret;
      },
    },
    toObject: {
      virtuals: true,
    },
  }
);

// Indexes
siteSettingsSchema.index({ isActive: 1 });
siteSettingsSchema.index({ updatedAt: -1 });

// Ensure only one active settings document exists
siteSettingsSchema.pre('save', async function (this: ISiteSettings, next) {
  if (this.isActive && this.isNew) {
    // Deactivate all other settings when creating a new active one
    await mongoose.model('SiteSettings').updateMany(
      { _id: { $ne: this._id } },
      { isActive: false }
    );
  }
  next();
});

const SiteSettings = mongoose.model<ISiteSettings>('SiteSettings', siteSettingsSchema);

export default SiteSettings;