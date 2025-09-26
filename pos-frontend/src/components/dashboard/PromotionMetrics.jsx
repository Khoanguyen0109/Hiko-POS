import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAnalytics } from '../../redux/slices/promotionSlice';
import { 
  MdLocalOffer as TagIcon, 
  MdTrendingUp as TrendingUpIcon, 
  MdPeople as UsersIcon, 
  MdAttachMoney as MoneyIcon,
  MdBarChart as ChartBarIcon
} from 'react-icons/md';

const PromotionMetrics = ({ dateFilter, customDateRange }) => {
  const dispatch = useDispatch();
  const { analytics, loading } = useSelector(state => state.promotions);

  // Convert dashboard date filter to API parameters
  const getDateRange = () => {
    const today = new Date();
    let startDate, endDate;

    switch (dateFilter) {
      case 'today':
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        weekStart.setHours(0, 0, 0, 0);
        startDate = weekStart;
        endDate = new Date();
        break;
      case 'month':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date();
        break;
      case 'custom':
        if (customDateRange.startDate && customDateRange.endDate) {
          startDate = new Date(customDateRange.startDate);
          endDate = new Date(customDateRange.endDate);
          endDate.setHours(23, 59, 59, 999);
        }
        break;
      default:
        // Default to today
        startDate = new Date(today.setHours(0, 0, 0, 0));
        endDate = new Date(today.setHours(23, 59, 59, 999));
    }

    return {
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString()
    };
  };

  useEffect(() => {
    const dateRange = getDateRange();
    if (dateRange.startDate && dateRange.endDate) {
      dispatch(fetchAnalytics(dateRange));
    }
  }, [dispatch, dateFilter, customDateRange]);

  // Format currency
  const formatVND = (amount) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + '₫';
  };

  // Get type color
  const getTypeColor = (type) => {
    const colors = {
      'order_percentage': 'bg-blue-900/20 text-blue-400 border-blue-500/30',
      'order_fixed': 'bg-green-900/20 text-green-400 border-green-500/30',
      'item_percentage': 'bg-purple-900/20 text-purple-400 border-purple-500/30',
      'item_fixed': 'bg-yellow-900/20 text-yellow-400 border-yellow-500/30',
      'happy_hour': 'bg-pink-900/20 text-pink-400 border-pink-500/30'
    };
    return colors[type] || 'bg-gray-900/20 text-gray-400 border-gray-500/30';
  };

  // Get type display name
  const getTypeDisplayName = (type) => {
    const typeMap = {
      'order_percentage': 'Order %',
      'order_fixed': 'Order Fixed',
      'item_percentage': 'Item %',
      'item_fixed': 'Item Fixed',
      'happy_hour': 'Happy Hour'
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f6b100]"></div>
          <span className="ml-2 text-[#ababab]">Loading promotion metrics...</span>
        </div>
      </div>
    );
  }

  if (!analytics?.summary) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
        <div className="text-center py-8">
          <TagIcon size={48} className="text-[#ababab] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">No promotion data</h3>
          <p className="text-[#ababab]">Promotion metrics will appear here once you have active promotions.</p>
        </div>
      </div>
    );
  }

  const { summary, discountByType, topPromotionsByDiscount } = analytics;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <TagIcon size={24} className="text-[#f6b100]" />
        <h2 className="text-xl font-semibold text-[#f5f5f5]">Promotion Metrics</h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Discount Amount */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm font-medium mb-1">Total Discount Given</p>
              <p className="text-2xl font-bold text-[#f6b100]">
                {formatVND(summary.totalDiscountAmount || 0)}
              </p>
              <p className="text-xs text-[#ababab] mt-1">
                From {summary.totalOrdersWithPromotions || 0} orders
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-[#f6b100]/20 rounded-full">
              <MoneyIcon size={24} className="text-[#f6b100]" />
            </div>
          </div>
        </div>

        {/* Active Promotions */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm font-medium mb-1">Active Promotions</p>
              <p className="text-2xl font-bold text-green-400">
                {summary.activePromotions || 0}
              </p>
              <p className="text-xs text-[#ababab] mt-1">
                of {summary.totalPromotions || 0} total
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-green-400/20 rounded-full">
              <TrendingUpIcon size={24} className="text-green-400" />
            </div>
          </div>
        </div>

        {/* Average Discount Per Order */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm font-medium mb-1">Avg Discount/Order</p>
              <p className="text-2xl font-bold text-purple-400">
                {formatVND(summary.averageDiscountPerOrder || 0)}
              </p>
              <p className="text-xs text-[#ababab] mt-1">
                Per promoted order
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-purple-400/20 rounded-full">
              <ChartBarIcon size={24} className="text-purple-400" />
            </div>
          </div>
        </div>

        {/* Total Usage */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#ababab] text-sm font-medium mb-1">Total Usage</p>
              <p className="text-2xl font-bold text-blue-400">
                {summary.totalUsage || 0}
              </p>
              <p className="text-xs text-[#ababab] mt-1">
                Times used
              </p>
            </div>
            <div className="flex items-center justify-center w-12 h-12 bg-blue-400/20 rounded-full">
              <UsersIcon size={24} className="text-blue-400" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Discount by Type */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-4">Discount by Type</h3>
          <div className="space-y-4">
            {discountByType && discountByType.length > 0 ? (
              discountByType.map((type) => (
                <div key={type._id} className="flex items-center justify-between p-4 bg-[#262626] rounded-lg border border-[#343434]">
                  <div className="flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getTypeColor(type._id)}`}>
                      {getTypeDisplayName(type._id)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-[#f5f5f5]">
                        {type.orderCount} order{type.orderCount !== 1 ? 's' : ''}
                      </p>
                      <p className="text-xs text-[#ababab]">
                        Avg: {formatVND(type.averageDiscount || 0)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#f6b100]">{formatVND(type.totalDiscount || 0)}</p>
                    <p className="text-xs text-[#ababab]">total saved</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#ababab]">
                <ChartBarIcon size={32} className="mx-auto mb-2 text-[#ababab]" />
                <p>No discount data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Top Performing Promotions */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6">
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-4">Top Promotions by Savings</h3>
          <div className="space-y-4">
            {topPromotionsByDiscount && topPromotionsByDiscount.length > 0 ? (
              topPromotionsByDiscount.map((promotion, index) => (
                <div key={promotion._id} className="flex items-center justify-between p-4 bg-[#262626] rounded-lg border border-[#343434]">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-400 text-[#1f1f1f]' : 
                      index === 1 ? 'bg-gray-400 text-[#1f1f1f]' : 
                      index === 2 ? 'bg-orange-400 text-[#1f1f1f]' : 'bg-[#343434] text-[#ababab]'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#f5f5f5]">{promotion.name}</p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTypeColor(promotion.type)}`}>
                          {getTypeDisplayName(promotion.type)}
                        </span>
                        <span className="text-xs text-[#ababab]">
                          {promotion.usageCount} uses
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#f6b100]">{formatVND(promotion.totalDiscount || 0)}</p>
                    <p className="text-xs text-[#ababab]">total saved</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-[#ababab]">
                <TrendingUpIcon size={32} className="mx-auto mb-2 text-[#ababab]" />
                <p>No promotion usage data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Insights */}
      {summary.totalDiscountAmount > 0 && (
        <div className="bg-[#f6b100]/10 rounded-lg border border-[#f6b100]/30 p-6">
          <h4 className="text-sm font-medium text-[#f6b100] mb-3 flex items-center gap-2">
            <TrendingUpIcon size={16} />
            💡 Promotion Insights
          </h4>
          <div className="text-sm text-[#f5f5f5] space-y-2">
            {summary.totalDiscountAmount > 0 && (
              <p>
                • Total savings provided to customers: <span className="font-semibold text-[#f6b100]">{formatVND(summary.totalDiscountAmount)}</span>
              </p>
            )}
            {summary.totalOrdersWithPromotions > 0 && (
              <p>
                • {summary.totalOrdersWithPromotions} orders benefited from promotions
              </p>
            )}
            {summary.averageDiscountPerOrder > 0 && (
              <p>
                • Average savings per promoted order: <span className="font-semibold text-[#f6b100]">{formatVND(summary.averageDiscountPerOrder)}</span>
              </p>
            )}
            {discountByType && discountByType.length > 0 && (
              <p>
                • Most effective promotion type: <span className="font-semibold text-[#f6b100]">{getTypeDisplayName(discountByType[0]._id)}</span>
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionMetrics;
