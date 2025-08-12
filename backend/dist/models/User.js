"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.User = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// User Schema
const UserSchema = new mongoose_1.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        required: [true, 'User role is required'],
        enum: {
            values: ['admin', 'teacher', 'student', 'parent'],
            message: 'Role must be one of: admin, teacher, student, parent'
        }
    },
    profile: {
        type: mongoose_1.Schema.Types.Mixed,
        required: [true, 'User profile is required']
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: {
        transform: function (doc, ret) {
            delete ret.password;
            return ret;
        }
    }
});
// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ 'profile.employeeId': 1 }, { sparse: true });
UserSchema.index({ 'profile.rollNo': 1, 'profile.standard': 1, 'profile.section': 1 }, { sparse: true });
// Pre-save middleware to hash password
UserSchema.pre('save', async function (next) {
    // Only hash the password if it has been modified (or is new)
    if (!this.isModified('password'))
        return next();
    try {
        await this.hashPassword();
        next();
    }
    catch (error) {
        next(error);
    }
});
// Instance method to hash password
UserSchema.methods.hashPassword = async function () {
    const saltRounds = 12;
    this.password = await bcryptjs_1.default.hash(this.password, saltRounds);
};
// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcryptjs_1.default.compare(candidatePassword, this.password);
};
// Static method to validate profile based on role
UserSchema.statics.validateProfile = function (role, profile) {
    switch (role) {
        case 'admin':
            return profile.name && profile.employeeId && profile.department && profile.phone;
        case 'teacher':
            return profile.name && profile.employeeId && profile.subjects &&
                Array.isArray(profile.subjects) && profile.phone && profile.address && profile.dateOfJoining;
        case 'student':
            return profile.name && profile.rollNo && profile.standard && profile.section &&
                profile.dateOfBirth && profile.admissionDate && profile.parentContact &&
                profile.parentContact.fatherName && profile.parentContact.motherName &&
                profile.parentContact.phone && profile.parentContact.email && profile.parentContact.address;
        case 'parent':
            return profile.name && profile.phone && profile.email && profile.address &&
                profile.children && Array.isArray(profile.children);
        default:
            return false;
    }
};
// Custom validation for profile based on role
UserSchema.pre('validate', function (next) {
    const UserModel = this.constructor;
    if (!UserModel.validateProfile(this.role, this.profile)) {
        return next(new Error(`Invalid profile data for role: ${this.role}`));
    }
    next();
});
exports.User = mongoose_1.default.model('User', UserSchema);
//# sourceMappingURL=User.js.map