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
      },
      subtitle: {
        type: String, 
        required: [true, 'Hero section subtitle is required'],
        trim: true,
      },
      buttonText: {
        type: String,
        default: 'Get Started',
      },
    },
    aboutSectionText: {
      title: {
        type: String,
        trim: true,
      },
      content: {
        type: String,
        trim: true,
      },
      mission: {
        type: String,
        trim: true,
      },
      vision: {
        type: String,
        trim: true,
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
      
      },
      twitter: {
        type: String,
        trim: true,
       
      },
      instagram: {
        type: String,
        trim: true,
        
      },
      linkedin: {
        type: String,
        trim: true,
       
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