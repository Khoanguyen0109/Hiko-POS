const mongoose = require("mongoose");
const { getCurrentVietnamTime } = require("../utils/dateUtils");

const promotionSchema = new mongoose.Schema({
  // Basic Information
  name: { 
    type: String, 
    required: true, 
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    trim: true,
    maxlength: 500
  },
  code: { 
    type: String, 
    unique: true, 
    sparse: true, 
    trim: true,
    uppercase: true,
    maxlength: 20
  },
  
  // Promotion Type & Configuration
  type: {
    type: String,
    required: true,
    enum: ['order_percentage', 'order_fixed', 'item_percentage', 'item_fixed', 'happy_hour']
  },
  
  // Discount Configuration
  discount: {
    percentage: { 
      type: Number, 
      min: 0, 
      max: 100
    },
    fixedAmount: { 
      type: Number, 
      min: 0
    },
    // Uniform pricing for Happy Hour (same price for all variants)
    uniformPrice: {
      type: Number,
      min: 0
    }
  },

  // Discount type for Happy Hour (percentage, fixed_amount, or uniform_price)
  discountType: {
    type: String,
    enum: ['percentage', 'fixed_amount', 'uniform_price'],
    validate: {
      validator: function(value) {
        return this.type === 'happy_hour' ? value != null : true;
      },
      message: 'Discount type is required for happy hour promotions'
    }
  },
  
  // Applicability Rules
  applicableItems: {
    type: String,
    enum: ['all_order', 'specific_dishes', 'categories'],
    default: 'all_order'
  },
  specificDishes: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Dish' 
  }],
  categories: [{ 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Category' 
  }],
  
  // Conditions
  conditions: {
    minOrderAmount: { 
      type: Number, 
      min: 0, 
      default: 0 
    },
    maxOrderAmount: { 
      type: Number, 
      min: 0 
    },
    timeSlots: [{
      start: { 
        type: String,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      },
      end: { 
        type: String,
        validate: {
          validator: function(v) {
            return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
          },
          message: 'Time must be in HH:MM format'
        }
      }
    }],
    daysOfWeek: [{ 
      type: String, 
      enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] 
    }],
    usageLimit: { 
      type: Number, 
      min: 1 
    },
    perCustomerLimit: { 
      type: Number, 
      min: 1 
    }
  },
  
  // Status & Validity
  isActive: { 
    type: Boolean, 
    default: true 
  },
  startDate: { 
    type: Date, 
    required: true,
    default: getCurrentVietnamTime
  },
  endDate: { 
    type: Date, 
    required: true
  },
  
  // Tracking
  usageCount: { 
    type: Number, 
    default: 0,
    min: 0
  },
  priority: { 
    type: Number, 
    default: 0 
  },
  
  // Metadata
  createdBy: {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    userName: { type: String, trim: true }
  }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for checking if promotion is currently active
promotionSchema.virtual('isCurrentlyActive').get(function() {
  const now = getCurrentVietnamTime();
  return this.isActive && 
         this.startDate <= now && 
         this.endDate >= now &&
         (!this.conditions.usageLimit || this.usageCount < this.conditions.usageLimit);
});

// Virtual for remaining usage
promotionSchema.virtual('remainingUsage').get(function() {
  if (!this.conditions.usageLimit) return null;
  return Math.max(0, this.conditions.usageLimit - this.usageCount);
});

// Indexes for better query performance
promotionSchema.index({ isActive: 1, startDate: 1, endDate: 1 });
promotionSchema.index({ type: 1 });
promotionSchema.index({ createdAt: -1 });

// Pre-save middleware to generate code if not provided
promotionSchema.pre('save', function(next) {
  if (!this.code && this.isNew) {
    // Generate a simple code based on name and timestamp
    const nameCode = this.name.replace(/\s+/g, '').substring(0, 5).toUpperCase();
    const timestamp = Date.now().toString().slice(-4);
    this.code = `${nameCode}${timestamp}`;
  }
  next();
});

const Promotion = mongoose.model("Promotion", promotionSchema);

module.exports = Promotion;

