import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    items: [],
    paymentMethod: "Cash", // Default payment method
    thirdPartyVendor: "None", // Default vendor
    appliedCoupon: null, // Applied coupon
    pricing: {
        subtotal: 0,
        discount: 0,
        total: 0
    }
};

const cartSlice = createSlice({
    name : "cart",
    initialState,
    reducers : {
        addItems : (state, action) => {
            const newItem = action.payload;
            
            // If Happy Hour is already applied, preserve original prices for new items
            if (state.appliedCoupon?.type === 'happy_hour') {
                // Store original prices before applying Happy Hour
                if (!newItem.originalPricePerQuantity) {
                    newItem.originalPricePerQuantity = newItem.pricePerQuantity;
                }
                if (!newItem.originalPrice) {
                    newItem.originalPrice = newItem.price;
                }
            }
            
            state.items.push(newItem);
            // Recalculate pricing when items are added (this will apply Happy Hour to new items)
            cartSlice.caseReducers.calculatePricing(state);
        },

        removeItem: (state, action) => {
            state.items = state.items.filter(item => item.id != action.payload);
            // Recalculate pricing when items are removed
            cartSlice.caseReducers.calculatePricing(state);
        },

        updateItemQuantity: (state, action) => {
            const { id, quantity, price } = action.payload;
            const item = state.items.find(item => item.id === id);
            if (item) {
                item.quantity = quantity;
                item.price = price;
            }
            // Recalculate pricing when quantities are updated
            cartSlice.caseReducers.calculatePricing(state);
        },

        setPaymentMethod: (state, action) => {
            state.paymentMethod = action.payload;
        },

        setThirdPartyVendor: (state, action) => {
            state.thirdPartyVendor = action.payload;
        },

        applyCoupon: (state, action) => {
            state.appliedCoupon = action.payload;
            
            // For Happy Hour promotions, preserve original prices before applying discounts
            if (action.payload?.type === 'happy_hour') {
                state.items.forEach(item => {
                    // Store original prices if not already stored
                    if (!item.originalPricePerQuantity) {
                        item.originalPricePerQuantity = item.pricePerQuantity;
                    }
                    if (!item.originalPrice) {
                        item.originalPrice = item.price;
                    }
                });
            }
            
            // Recalculate pricing when coupon is applied
            cartSlice.caseReducers.calculatePricing(state);
        },

        removeCoupon: (state) => {
            // Restore original prices before removing coupon
            if (state.appliedCoupon?.type === 'happy_hour') {
                state.items.forEach(item => {
                    if (item.originalPricePerQuantity) {
                        item.pricePerQuantity = item.originalPricePerQuantity;
                        item.price = item.originalPrice || (item.originalPricePerQuantity * item.quantity);
                    }
                });
            }
            
            state.appliedCoupon = null;
            // Recalculate pricing when coupon is removed
            cartSlice.caseReducers.calculatePricing(state);
        },

        calculatePricing: (state) => {
            // Calculate subtotal using original prices if available (for Happy Hour)
            const subtotal = state.items.reduce((total, item) => {
                // Use original price if available (Happy Hour), otherwise use current price
                let itemTotal = item.originalPrice || item.price;
                
                // Fallback: if no originalPrice but has originalPricePerQuantity
                if (!item.originalPrice && item.originalPricePerQuantity) {
                    itemTotal = item.originalPricePerQuantity * item.quantity;
                }
                
                // Final fallback: calculate from current price
                if (!itemTotal) {
                    const expectedPrice = item.pricePerQuantity * item.quantity;
                    itemTotal = Math.abs(item.price - expectedPrice) > 0.01 ? expectedPrice : item.price;
                }
                
                return total + itemTotal;
            }, 0);

            state.pricing.subtotal = subtotal;
            
            console.log('💰 Pricing calculation:', {
                items: state.items.map(item => ({
                    name: item.name,
                    originalPrice: item.originalPrice,
                    currentPrice: item.price,
                    originalPricePerQuantity: item.originalPricePerQuantity,
                    currentPricePerQuantity: item.pricePerQuantity,
                    quantity: item.quantity
                })),
                calculatedSubtotal: subtotal,
                appliedCoupon: state.appliedCoupon?.name
            });

            // Calculate discount
            let discount = 0;
            if (state.appliedCoupon) {
                const coupon = state.appliedCoupon;
                if (coupon.type === 'order_percentage' && coupon.discount?.percentage) {
                    discount = subtotal * (coupon.discount.percentage / 100);
                } else if (coupon.type === 'order_fixed' && coupon.discount?.fixedAmount) {
                    discount = Math.min(coupon.discount.fixedAmount, subtotal);
                } else if (coupon.type === 'happy_hour') {
                    // Apply Happy Hour pricing to individual items and calculate discount
                    discount = cartSlice.caseReducers.applyHappyHourPricing(state, coupon);
                }
                // Add other coupon types as needed
            }

            state.pricing.discount = discount;
            state.pricing.total = Math.max(0, subtotal - discount);
        },

        applyHappyHourPricing: (state, coupon) => {
            if (!coupon || coupon.type !== 'happy_hour') return 0;

            console.log('🎯 CartSlice: Applying Happy Hour pricing to items');
            let totalDiscount = 0;

            state.items.forEach(item => {
                // Check if item is eligible for happy hour promotion
                const isEligible = cartSlice.caseReducers.isItemEligibleForHappyHour(state, item, coupon);
                
                if (isEligible) {
                    const originalPrice = item.originalPrice || item.price;
                    let newPrice = originalPrice;
                    let itemDiscount = 0;

                    // Calculate new price based on discount type
                    if (coupon.discountType === 'percentage' && coupon.discount?.percentage) {
                        itemDiscount = originalPrice * (coupon.discount.percentage / 100);
                        newPrice = originalPrice - itemDiscount;
                    } else if (coupon.discountType === 'fixed_amount' && coupon.discount?.fixedAmount) {
                        itemDiscount = Math.min(coupon.discount.fixedAmount * item.quantity, originalPrice);
                        newPrice = originalPrice - itemDiscount;
                    } else if (coupon.discountType === 'uniform_price' && coupon.discount?.uniformPrice) {
                        // Set uniform price
                        newPrice = coupon.discount.uniformPrice * item.quantity;
                        itemDiscount = Math.max(0, originalPrice - newPrice);
                    }

                    // Apply the new pricing to the item
                    item.price = newPrice;
                    item.pricePerQuantity = newPrice / item.quantity;
                    totalDiscount += itemDiscount;

                    console.log(`Applied Happy Hour to ${item.name}: ${originalPrice} -> ${newPrice} (discount: ${itemDiscount})`);
                }
            });

            console.log(`Total Happy Hour discount applied: ${totalDiscount}`);
            return totalDiscount;
        },

        calculateHappyHourDiscount: (state, coupon) => {
            if (!coupon || coupon.type !== 'happy_hour') return 0;

            console.log('🧮 CartSlice: Calculating Happy Hour discount');
            console.log('Coupon:', coupon);
            console.log('Cart items:', state.items);

            let totalDiscount = 0;

            state.items.forEach(item => {
                let itemDiscount = 0;
                const itemPrice = item.price;

                // Check if item is eligible for happy hour promotion
                const isEligible = cartSlice.caseReducers.isItemEligibleForHappyHour(state, item, coupon);
                console.log(`Item ${item.name} (category: ${item.category}) eligible: ${isEligible}`);
                
                if (isEligible) {
                    console.log(`Processing eligible item: ${item.name}, price: ${itemPrice}, discountType: ${coupon.discountType}`);
                    
                    // Handle different Happy Hour discount types
                    if (coupon.discountType === 'percentage' && coupon.discount?.percentage) {
                        itemDiscount = itemPrice * (coupon.discount.percentage / 100);
                        console.log(`Percentage discount: ${coupon.discount.percentage}% = ${itemDiscount}`);
                    } else if (coupon.discountType === 'fixed_amount' && coupon.discount?.fixedAmount) {
                        itemDiscount = Math.min(coupon.discount.fixedAmount * item.quantity, itemPrice);
                        console.log(`Fixed amount discount: ${coupon.discount.fixedAmount} * ${item.quantity} = ${itemDiscount}`);
                    } else if (coupon.discountType === 'uniform_price' && coupon.discount?.uniformPrice) {
                        // For uniform pricing, calculate discount as difference between current price and uniform price
                        const uniformTotalPrice = coupon.discount.uniformPrice * item.quantity;
                        itemDiscount = Math.max(0, itemPrice - uniformTotalPrice);
                        console.log(`Uniform price discount: ${itemPrice} - (${coupon.discount.uniformPrice} * ${item.quantity}) = ${itemDiscount}`);
                    } else {
                        // Legacy support for old Happy Hour promotions without discountType
                        if (coupon.discount?.percentage) {
                            itemDiscount = itemPrice * (coupon.discount.percentage / 100);
                        } else if (coupon.discount?.fixedAmount) {
                            itemDiscount = Math.min(coupon.discount.fixedAmount * item.quantity, itemPrice);
                        }
                        console.log(`Legacy discount: ${itemDiscount}`);
                    }
                }

                totalDiscount += itemDiscount;
            });

            console.log(`Total Happy Hour discount calculated: ${totalDiscount}`);
            return totalDiscount;
        },

        isItemEligibleForHappyHour: (state, item, coupon) => {
            if (!coupon || coupon.type !== 'happy_hour') return false;

            // Check applicability
            if (coupon.applicableItems === 'all_order') {
                return true;
            } else if (coupon.applicableItems === 'specific_dishes') {
                return coupon.specificDishes?.some(dishId => 
                    dishId === item.dishId || dishId._id === item.dishId
                );
            } else if (coupon.applicableItems === 'categories') {
                return coupon.categories?.some(category => {
                    // Handle both ObjectId and populated category objects
                    if (typeof category === 'object' && category.name) {
                        // Category is populated with name
                        return category.name.toLowerCase() === item.category?.toLowerCase();
                    } else {
                        // Category is ObjectId - check if item.category matches ID or name
                        return category._id === item.category || category === item.category;
                    }
                });
            }

            return false;
        },

        removeAllItems: (state) => {
            state.items = [];
            state.paymentMethod = "Cash"; // Reset to default
            state.thirdPartyVendor = "None"; // Reset to default
            state.appliedCoupon = null; // Reset coupon
            state.pricing = { subtotal: 0, discount: 0, total: 0 }; // Reset pricing
        }
    }
})

// Selectors
export const getTotalPrice = (state) => {
    // Use the calculated pricing if available, otherwise fallback to old calculation
    if (state.cart.pricing.total > 0 || state.cart.appliedCoupon) {
        return state.cart.pricing.total;
    }
    
    return state.cart.items.reduce((total, item) => {
        let itemTotal = item.price;
        const expectedPrice = item.pricePerQuantity * item.quantity;
        if (Math.abs(itemTotal - expectedPrice) > 0.01) {
            itemTotal = expectedPrice;
        }
        return total + itemTotal;
    }, 0);
};

export const getSubtotal = (state) => {
    // Always calculate the raw subtotal (before discounts)
    if (state.cart.pricing.subtotal > 0) {
        return state.cart.pricing.subtotal;
    }
    
    // Calculate raw subtotal from items
    return state.cart.items.reduce((total, item) => {
        let itemTotal = item.price;
        const expectedPrice = item.pricePerQuantity * item.quantity;
        if (Math.abs(itemTotal - expectedPrice) > 0.01) {
            itemTotal = expectedPrice;
        }
        return total + itemTotal;
    }, 0);
};

export const getDiscount = (state) => {
    return state.cart.pricing.discount || 0;
};

export const getAppliedCoupon = (state) => {
    return state.cart.appliedCoupon;
};

export const { 
    addItems, 
    removeItem, 
    updateItemQuantity, 
    setPaymentMethod, 
    setThirdPartyVendor, 
    removeAllItems,
    applyCoupon,
    removeCoupon,
    calculatePricing
} = cartSlice.actions;
export default cartSlice.reducer;