import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPromotions } from '../../redux/slices/promotionSlice';
import { applyCoupon, removeCoupon, getAppliedCoupon } from '../../redux/slices/cartSlice';
import { MdLocalOffer as TagIcon, MdCheck as CheckIcon, MdClose as XIcon, MdPercent as PercentIcon, MdExpandMore as ExpandMoreIcon, MdExpandLess as ExpandLessIcon, MdAccessTime as ClockIcon } from 'react-icons/md';

const CouponSelector = () => {
  const dispatch = useDispatch();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  
  const { items: promotions, loading } = useSelector(state => state.promotions);
  const appliedCoupon = useSelector(getAppliedCoupon);
  
  // Filter active coupons that are currently valid (including happy hour)
  const activeCoupons = promotions.filter(promotion => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    return promotion.isActive && 
           now >= startDate && 
           now <= endDate &&
           (promotion.type === 'order_percentage' || 
            promotion.type === 'order_fixed' || 
            promotion.type === 'happy_hour');
  });

  useEffect(() => {
    // Fetch promotions when component mounts
    dispatch(fetchPromotions({ isActive: true, limit: 50 }));
  }, [dispatch]);

  const handleSelectCoupon = (coupon) => {
    dispatch(applyCoupon(coupon));
    setIsAccordionOpen(false); // Close accordion when coupon is selected
  };

  const handleRemoveCoupon = () => {
    dispatch(removeCoupon());
  };

  const formatDiscount = (coupon) => {
    if (coupon.type === 'happy_hour') {
      if (coupon.discount?.percentage) {
        return `${coupon.discount.percentage}% off (Happy Hour)`;
      }
      if (coupon.discount?.fixedAmount) {
        return `${coupon.discount.fixedAmount.toLocaleString()}₫ off (Happy Hour)`;
      }
      if (coupon.discount?.uniformPrice) {
        return `${coupon.discount.uniformPrice.toLocaleString()}₫ each (Happy Hour)`;
      }
      return 'Happy Hour Special';
    }
    if (coupon.discount?.percentage) {
      return `${coupon.discount.percentage}% off`;
    }
    if (coupon.discount?.fixedAmount) {
      return `${coupon.discount.fixedAmount.toLocaleString()}₫ off`;
    }
    return 'Discount';
  };

  console.log('appliedCoupon', appliedCoupon)
  return (
    <div className="bg-[#262626] rounded-lg border border-[#343434]">
      {/* Applied Coupon Display */}
      {appliedCoupon ? (
        <div className={`flex items-center justify-between p-3 rounded-lg ${
          appliedCoupon.type === 'happy_hour' 
            ? 'bg-orange-900/20 border border-orange-500/30' 
            : 'bg-green-900/20 border border-green-500/30'
        }`}>
          <div className="flex items-center space-x-2 flex-1 min-w-0">
            {appliedCoupon.type === 'happy_hour' ? (
              <ClockIcon size={16} className="text-orange-400 flex-shrink-0" />
            ) : (
              <CheckIcon size={16} className="text-green-400 flex-shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-[#f5f5f5] text-sm font-medium flex items-center space-x-1 flex-wrap">
                <span className="truncate">{appliedCoupon.name}</span>
                {appliedCoupon.type === 'happy_hour' && (
                  <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                    Happy Hour
                  </span>
                )}
              </div>
              <div className="text-xs text-[#ccc]">
                {formatDiscount(appliedCoupon)}
              </div>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-red-400 hover:text-red-300 transition-colors ml-2 flex-shrink-0"
            title="Remove coupon"
          >
            <XIcon size={16} />
          </button>
        </div>
      ) : (
        /* Coupon Selection Accordion */
        <>
          {/* Accordion Header */}
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between p-3 hover:bg-[#2a2a2a] transition-colors rounded-lg focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <TagIcon size={16} className="text-[#f6b100]" />
              <span className="text-[#f5f5f5] text-sm font-medium">
                {loading ? 'Loading...' : `Coupons (${activeCoupons.length})`}
              </span>
            </div>
            {isAccordionOpen ? (
              <ExpandLessIcon size={18} className="text-[#ababab]" />
            ) : (
              <ExpandMoreIcon size={18} className="text-[#ababab]" />
            )}
          </button>

          {/* Accordion Content */}
          {isAccordionOpen && (
            <div className="border-t border-[#343434] p-3">
              {loading ? (
                <div className="text-[#ababab] text-center py-3 text-sm">Loading...</div>
              ) : activeCoupons.length === 0 ? (
                <div className="text-[#ababab] text-center py-3 text-sm">No coupons available</div>
              ) : (
                <div className="space-y-2">
                  {activeCoupons.map(coupon => (
                    <div
                      key={coupon._id}
                      onClick={() => handleSelectCoupon(coupon)}
                      className="p-2.5 bg-[#1a1a1a] border border-[#343434] rounded-md hover:border-[#f6b100] hover:bg-[#222] cursor-pointer transition-all"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-2 flex-1 min-w-0">
                          <div className={`flex items-center justify-center w-7 h-7 rounded-full flex-shrink-0 ${
                            coupon.type === 'happy_hour' 
                              ? 'bg-orange-500/20' 
                              : 'bg-[#f6b100]/20'
                          }`}>
                            {coupon.type === 'happy_hour' ? (
                              <ClockIcon size={12} className="text-orange-400" />
                            ) : (
                              <PercentIcon size={12} className="text-[#f6b100]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-[#f5f5f5] text-sm font-medium flex items-center space-x-1 flex-wrap">
                              <span className="truncate">{coupon.name}</span>
                              {coupon.type === 'happy_hour' && (
                                <span className="text-xs bg-orange-500/20 text-orange-400 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                  Happy Hour
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-[#ccc]">
                              {formatDiscount(coupon)}
                              {coupon.conditions?.minOrderAmount && 
                                ` • Min: ${coupon.conditions.minOrderAmount.toLocaleString()}₫`
                              }
                            </div>
                            {coupon.type === 'happy_hour' && coupon.conditions?.timeSlots && (
                              <div className="text-xs text-orange-400 mt-0.5">
                                {coupon.conditions.timeSlots.map(slot => 
                                  `${slot.start}-${slot.end}`
                                ).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CouponSelector;
