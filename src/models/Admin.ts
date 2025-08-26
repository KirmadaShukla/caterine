import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IAdmin extends Document {
  email: string;
  password: string;
  name: string;
  active: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  correctPassword(candidatePassword: string, userPassword: string): Promise<boolean>;
}

const adminSchema = new Schema<IAdmin>(
  {
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true,
      maxlength: [50, 'Name cannot be longer than 50 characters'],
      minlength: [2, 'Name must be at least 2 characters long'],
      validate: {
        validator: function(value: string) {
          return /^[a-zA-Z\s]+$/.test(value);
        },
        message: 'Name should only contain letters and spaces'
      }
    },
    email: {
      type: String,
      required: [true, 'Please provide an email'],
      unique: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: function(value: string) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        },
        message: 'Please provide a valid email address'
      }
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [8, 'Password must be at least 8 characters long'],
      validate: {
        validator: function(value: string) {
          return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value);
        },
        message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      },
      select: false,
    },
    active: {
      type: Boolean,
      default: true,
      select: false,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc: any, ret: any) {
        if (ret.password) ret.password = undefined;
        if (ret.passwordChangedAt) ret.passwordChangedAt = undefined;
        if (ret.passwordResetToken) ret.passwordResetToken = undefined;
        if (ret.passwordResetExpires) ret.passwordResetExpires = undefined;
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
adminSchema.index({ active: 1 });
adminSchema.index({ createdAt: -1 });

// Pre-save middleware
adminSchema.pre('save', async function (this: IAdmin, next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);

  next();
});

// Query middleware - exclude inactive admins by default
adminSchema.pre(/^find/, function (this: any, next) {
  this.find({ active: { $ne: false } });
  next();
});

// Instance methods
adminSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const Admin = mongoose.model<IAdmin>('Admin', adminSchema);

export default Admin;