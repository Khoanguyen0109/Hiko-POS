import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPromotions } from '../../redux/slices/promotionSlice';
import { applyCoupon, removeCoupon, getAppliedCoupon } from '../../redux/slices/cartSlice';
import { MdLocalOffer as TagIcon, MdCheck as CheckIcon, MdClose as XIcon, MdPercent as PercentIcon, MdExpandMore as ExpandMoreIcon, MdExpandLess as ExpandLessIcon } from 'react-icons/md';

const CouponSelector = () => {
  const dispatch = useDispatch();
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);
  
  const { items: promotions, loading } = useSelector(state => state.promotions);
  const appliedCoupon = useSelector(getAppliedCoupon);
  
  // Filter active coupons that are currently valid
  const activeCoupons = promotions.filter(promotion => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);
    
    return promotion.isActive && 
           now >= startDate && 
           now <= endDate &&
           (promotion.type === 'order_percentage' || promotion.type === 'order_fixed');
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
    if (coupon.discount?.percentage) {
      return `${coupon.discount.percentage}% off`;
    }
    if (coupon.discount?.fixedAmount) {
      return `${coupon.discount.fixedAmount.toLocaleString()}₫ off`;
    }
    return 'Discount';
  };

  return (
    <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-4 mb-4">
      <div className="flex items-center space-x-2 mb-3">
        <TagIcon size={20} className="text-[#f6b100]" />
        <h3 className="text-lg font-semibold text-[#f5f5f5]">Available Coupons</h3>
      </div>

      {/* Applied Coupon Display */}
      {appliedCoupon && (
        <div className="mb-4">
          <div className="flex items-center justify-between p-3 bg-green-900/20 border border-green-500/30 rounded-md">
            <div className="flex items-center space-x-2">
              <CheckIcon size={16} className="text-green-400" />
              <div>
                <div className="text-[#f5f5f5] font-medium">{appliedCoupon.name}</div>
                <div className="text-sm text-[#ccc]">
                  {appliedCoupon.code && `Code: ${appliedCoupon.code} • `}
                  {formatDiscount(appliedCoupon)}
                </div>
              </div>
            </div>
            <button
              onClick={handleRemoveCoupon}
              className="text-red-400 hover:text-red-300 transition-colors"
              title="Remove coupon"
            >
              <XIcon size={16} />
            </button>
          </div>
          {appliedCoupon.description && (
            <div className="text-sm text-[#ccc] mt-2 px-3">{appliedCoupon.description}</div>
          )}
        </div>
      )}

      {/* Coupon Selection Accordion */}
      {!appliedCoupon && (
        <div className="bg-[#262626] rounded-lg border border-[#343434]">
          {/* Accordion Header */}
          <button
            onClick={() => setIsAccordionOpen(!isAccordionOpen)}
            className="w-full flex items-center justify-between p-4 hover:bg-[#2a2a2a] transition-colors rounded-lg focus:outline-none"
          >
            <div className="flex items-center space-x-2">
              <PercentIcon size={18} className="text-[#f6b100]" />
              <span className="text-[#f5f5f5] font-medium">
                {loading ? 'Loading coupons...' : `Available Coupons (${activeCoupons.length})`}
              </span>
            </div>
            {isAccordionOpen ? (
              <ExpandLessIcon size={20} className="text-[#ababab]" />
            ) : (
              <ExpandMoreIcon size={20} className="text-[#ababab]" />
            )}
          </button>

          {/* Accordion Content */}
          {isAccordionOpen && (
            <div className="border-t border-[#343434] p-4">
              {loading ? (
                <div className="text-[#ababab] text-center py-4">Loading available coupons...</div>
              ) : activeCoupons.length === 0 ? (
                <div className="text-[#ababab] text-center py-4">No active coupons available</div>
              ) : (
                <div className="space-y-3">
                  <div className="text-sm text-[#ababab] mb-3">Select a coupon to apply:</div>
                  {activeCoupons.map(coupon => (
                    <div
                      key={coupon._id}
                      onClick={() => handleSelectCoupon(coupon)}
                      className="p-3 bg-[#1a1a1a] border border-[#343434] rounded-md hover:border-[#f6b100] hover:bg-[#222] cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-[#f6b100]/20 rounded-full">
                            <PercentIcon size={14} className="text-[#f6b100]" />
                          </div>
                          <div>
                            <div className="text-[#f5f5f5] font-medium">{coupon.name}</div>
                            <div className="text-sm text-[#ccc]">
                              {coupon.code && `${coupon.code} • `}
                              {formatDiscount(coupon)}
                              {coupon.conditions?.minOrderAmount && 
                                ` • Min order: ${coupon.conditions.minOrderAmount.toLocaleString()}₫`
                              }
                            </div>
                            {coupon.description && (
                              <div className="text-xs text-[#ababab] mt-1">{coupon.description}</div>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-[#ababab]">
                          Expires: {new Date(coupon.endDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CouponSelector;
