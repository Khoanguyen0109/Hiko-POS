const Promotion = require('../models/promotionModel');
const { getCurrentVietnamTime } = require('../utils/dateUtils');

/**
 * Promotion Service - Handles Happy Hour and other promotion logic with Vietnam timezone
 */
class PromotionService {
    
    /**
     * Get current Vietnam time for promotion calculations
     */
    static getCurrentVietnamTime() {
        return getCurrentVietnamTime();
    }

    /**
     * Check if current time is within a time slot (Vietnam timezone)
     */
    static isCurrentTimeInSlot(timeSlot) {
        if (!timeSlot.start || !timeSlot.end) return false;
        
        const now = this.getCurrentVietnamTime();
        const currentTime = now.getHours() * 60 + now.getMinutes(); // Convert to minutes
        
        const [startHour, startMin] = timeSlot.start.split(':').map(Number);
        const [endHour, endMin] = timeSlot.end.split(':').map(Number);
        
        const startTime = startHour * 60 + startMin;
        const endTime = endHour * 60 + endMin;
        
        // Handle time slots that cross midnight
        if (startTime > endTime) {
            return currentTime >= startTime || currentTime <= endTime;
        }
        
        return currentTime >= startTime && currentTime <= endTime;
    }

    /**
     * Check if current day is valid for promotion (Vietnam timezone)
     */
    static isCurrentDayValid(daysOfWeek) {
        if (!daysOfWeek || daysOfWeek.length === 0) return true; // No day restriction
        
        const now = this.getCurrentVietnamTime();
        const currentDay = now.toLocaleDateString('en-US', { 
            weekday: 'long',
            timeZone: 'Asia/Ho_Chi_Minh'
        }).toLowerCase();
        
        return daysOfWeek.includes(currentDay);
    }

    /**
     * Check if an item is eligible for a specific promotion
     */
    static isItemEligibleForPromotion(item, promotion) {
        if (promotion.applicableItems === 'all_order') {
            return true;
        } else if (promotion.applicableItems === 'specific_dishes') {
            return promotion.specificDishes?.some(dishId => 
                dishId.toString() === item.dishId.toString()
            );
        } else if (promotion.applicableItems === 'categories') {
            return promotion.categories?.some(categoryId => 
                categoryId.toString() === item.category?.toString() || 
                categoryId.name === item.category
            );
        }
        return false;
    }

    /**
     * Find active Happy Hour promotions for current time (Vietnam timezone)
     */
    static async findActiveHappyHourPromotions() {
        const now = this.getCurrentVietnamTime();
        
        // Get all active Happy Hour promotions
        const promotions = await Promotion.find({
            type: 'happy_hour',
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now }
        }).populate('specificDishes categories');

        // Filter by current day and time
        const activePromotions = promotions.filter(promotion => {
            // Check if current day is valid
            if (!this.isCurrentDayValid(promotion.conditions?.daysOfWeek)) return false;
            
            // Check if current time is within any time slot
            const timeSlots = promotion.conditions?.timeSlots || [];
            if (timeSlots.length === 0) return true; // No time restriction
            
            return timeSlots.some(slot => this.isCurrentTimeInSlot(slot));
        });

        // Sort by priority (highest first)
        return activePromotions.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    }

    /**
     * Calculate Happy Hour discount for a specific item
     */
    static calculateItemHappyHourDiscount(item, promotion) {
        if (!this.isItemEligibleForPromotion(item, promotion)) {
            return 0;
        }

        const itemPrice = item.originalPrice || item.price;
        let discount = 0;

        // Handle different Happy Hour discount types
        if (promotion.discountType === 'percentage' && promotion.discount?.percentage) {
            discount = itemPrice * (promotion.discount.percentage / 100);
        } else if (promotion.discountType === 'fixed_amount' && promotion.discount?.fixedAmount) {
            discount = Math.min(promotion.discount.fixedAmount * item.quantity, itemPrice);
        } else if (promotion.discountType === 'uniform_price' && promotion.discount?.uniformPrice) {
            // For uniform pricing, calculate discount as difference between current price and uniform price
            const uniformTotalPrice = promotion.discount.uniformPrice * item.quantity;
            discount = Math.max(0, itemPrice - uniformTotalPrice);
        } else {
            // Legacy support for old Happy Hour promotions without discountType
            if (promotion.discount?.percentage) {
                discount = itemPrice * (promotion.discount.percentage / 100);
            } else if (promotion.discount?.fixedAmount) {
                discount = Math.min(promotion.discount.fixedAmount * item.quantity, itemPrice);
            }
        }

        return Math.max(0, discount);
    }

    /**
     * Apply Happy Hour promotions to order items
     */
    static async applyHappyHourPromotions(orderItems) {
        const activePromotions = await this.findActiveHappyHourPromotions();
        if (activePromotions.length === 0) {
            return { items: orderItems, appliedPromotions: [], totalDiscount: 0 };
        }

        const appliedPromotions = [];
        let totalDiscount = 0;
        const now = this.getCurrentVietnamTime();

        // Process each item
        const processedItems = orderItems.map(item => {
            const processedItem = { ...item };
            
            // Ensure we have original prices
            if (!processedItem.originalPricePerQuantity) {
                processedItem.originalPricePerQuantity = processedItem.pricePerQuantity;
            }
            if (!processedItem.originalPrice) {
                processedItem.originalPrice = processedItem.originalPricePerQuantity * processedItem.quantity;
            }

            // Initialize promotion arrays
            processedItem.promotionsApplied = processedItem.promotionsApplied || [];
            processedItem.isHappyHourItem = false;
            processedItem.happyHourDiscount = 0;

            // Find the best promotion for this item
            for (const promotion of activePromotions) {
                const discount = this.calculateItemHappyHourDiscount(processedItem, promotion);
                
                if (discount > 0) {
                    // Apply the promotion
                    processedItem.isHappyHourItem = true;
                    processedItem.happyHourDiscount = discount;
                    
                    // Handle uniform pricing differently
                    if (promotion.discountType === 'uniform_price' && promotion.discount?.uniformPrice) {
                        // Set uniform price per quantity
                        processedItem.pricePerQuantity = promotion.discount.uniformPrice;
                        processedItem.price = promotion.discount.uniformPrice * processedItem.quantity;
                    } else {
                        // Standard discount calculation
                        processedItem.pricePerQuantity = processedItem.originalPricePerQuantity - (discount / processedItem.quantity);
                        processedItem.price = processedItem.originalPrice - discount;
                    }

                    // Track promotion applied to this item
                    const promotionDetail = {
                        promotionId: promotion._id,
                        promotionName: promotion.name,
                        promotionType: promotion.type,
                        discountType: promotion.discountType || 'percentage', // Default for legacy
                        discountAmount: discount,
                        discountPercentage: promotion.discount?.percentage || null,
                        uniformPrice: promotion.discount?.uniformPrice || null,
                        appliedAt: now
                    };
                    
                    processedItem.promotionsApplied.push(promotionDetail);
                    totalDiscount += discount;

                    // Add to applied promotions if not already added
                    const existingPromotion = appliedPromotions.find(p => 
                        p.promotionId.toString() === promotion._id.toString()
                    );
                    
                    if (!existingPromotion) {
                        appliedPromotions.push({
                            promotionId: promotion._id,
                            name: promotion.name,
                            type: promotion.type,
                            discountAmount: discount,
                            code: promotion.code,
                            appliedToItems: [processedItem._id || processedItem.dishId]
                        });
                    } else {
                        existingPromotion.discountAmount += discount;
                        existingPromotion.appliedToItems.push(processedItem._id || processedItem.dishId);
                    }

                    // Use only the first (highest priority) applicable promotion
                    break;
                }
            }

            return processedItem;
        });

        return {
            items: processedItems,
            appliedPromotions,
            totalDiscount
        };
    }

    /**
     * Validate Happy Hour pricing for an order
     */
    static async validateHappyHourPricing(orderItems, appliedPromotions) {
        const validationResults = [];
        
        for (const item of orderItems) {
            if (item.isHappyHourItem) {
                const happyHourPromo = appliedPromotions.find(p => 
                    p.type === 'happy_hour' && 
                    p.appliedToItems.includes(item._id || item.dishId.toString())
                );
                
                if (happyHourPromo) {
                    // Get the promotion details
                    const promotion = await Promotion.findById(happyHourPromo.promotionId);
                    if (promotion) {
                        const expectedDiscount = this.calculateItemHappyHourDiscount(item, promotion);
                        const actualDiscount = item.originalPrice - item.price;
                        
                        if (Math.abs(expectedDiscount - actualDiscount) > 0.01) {
                            validationResults.push({
                                itemName: item.name,
                                expected: expectedDiscount,
                                actual: actualDiscount,
                                valid: false,
                                message: `Happy Hour discount mismatch for ${item.name}`
                            });
                        } else {
                            validationResults.push({
                                itemName: item.name,
                                expected: expectedDiscount,
                                actual: actualDiscount,
                                valid: true
                            });
                        }
                    }
                }
            }
        }
        
        return validationResults;
    }

    /**
     * Get promotion analytics with Vietnam timezone
     */
    static async getPromotionUsageStats(startDate, endDate) {
        const Order = require('../models/orderModel');
        
        const matchStage = {
            'appliedPromotions.0': { $exists: true }
        };
        
        if (startDate && endDate) {
            matchStage.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const stats = await Order.aggregate([
            { $match: matchStage },
            { $unwind: '$appliedPromotions' },
            {
                $group: {
                    _id: '$appliedPromotions.type',
                    count: { $sum: 1 },
                    totalDiscount: { $sum: '$appliedPromotions.discountAmount' },
                    avgDiscount: { $avg: '$appliedPromotions.discountAmount' }
                }
            }
        ]);

        return stats;
    }
}

module.exports = PromotionService;
