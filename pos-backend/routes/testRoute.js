const express = require('express');
const router = express.Router();
const PromotionService = require('../services/promotionService');
const { getCurrentVietnamTime } = require('../utils/dateUtils');

// Test endpoint to check Happy Hour status with Vietnam timezone
router.get('/happy-hour-status', async (req, res, next) => {
    try {
        const vietnamTime = getCurrentVietnamTime();
        const activePromotions = await PromotionService.findActiveHappyHourPromotions();
        
        res.json({
            success: true,
            data: {
                currentVietnamTime: vietnamTime,
                currentDay: vietnamTime.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    timeZone: 'Asia/Ho_Chi_Minh'
                }).toLowerCase(),
                currentTime: `${vietnamTime.getHours().toString().padStart(2, '0')}:${vietnamTime.getMinutes().toString().padStart(2, '0')}`,
                activeHappyHourPromotions: activePromotions.map(p => ({
                    id: p._id,
                    name: p.name,
                    type: p.type,
                    discount: p.discount,
                    timeSlots: p.conditions?.timeSlots || [],
                    daysOfWeek: p.conditions?.daysOfWeek || [],
                    applicableItems: p.applicableItems,
                    priority: p.priority || 0
                }))
            }
        });
    } catch (error) {
        next(error);
    }
});

// Test endpoint to simulate Happy Hour application
router.post('/test-happy-hour-application', async (req, res, next) => {
    try {
        const { items } = req.body;
        
        if (!items || !Array.isArray(items)) {
            return res.status(400).json({
                success: false,
                message: 'Items array is required'
            });
        }

        const result = await PromotionService.applyHappyHourPromotions(items);
        
        res.json({
            success: true,
            data: {
                vietnamTime: getCurrentVietnamTime(),
                originalItems: items,
                processedItems: result.items,
                appliedPromotions: result.appliedPromotions,
                totalDiscount: result.totalDiscount,
                summary: {
                    itemsProcessed: result.items.length,
                    itemsWithHappyHour: result.items.filter(item => item.isHappyHourItem).length,
                    promotionsApplied: result.appliedPromotions.length
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
