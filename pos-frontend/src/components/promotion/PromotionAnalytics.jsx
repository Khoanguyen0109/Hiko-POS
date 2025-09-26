import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { fetchAnalytics } from '../../redux/slices/promotionSlice';
import { 
  MdBarChart as ChartBarIcon, 
  MdTrendingUp as TrendingUpIcon, 
  MdPeople as UsersIcon, 
  MdLocalOffer as TagIcon 
} from 'react-icons/md';

const PromotionAnalytics = ({ analytics, loading }) => {
  const dispatch = useDispatch();
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0] // today
  });

  // Handle date range change
  const handleDateRangeChange = (field, value) => {
    const newDateRange = {
      ...dateRange,
      [field]: value
    };
    setDateRange(newDateRange);
    
    // Fetch new analytics with updated date range
    dispatch(fetchAnalytics(newDateRange));
  };

  // Get type color
  const getTypeColor = (type) => {
    const colors = {
      'order_percentage': 'bg-blue-100 text-blue-800',
      'order_fixed': 'bg-green-100 text-green-800',
      'item_percentage': 'bg-purple-100 text-purple-800',
      'item_fixed': 'bg-yellow-100 text-yellow-800',
      'happy_hour': 'bg-pink-100 text-pink-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
      <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-[#ababab]">Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="bg-[#1a1a1a] rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <ChartBarIcon size={48} className="text-[#ababab] mx-auto mb-4" />
          <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">No analytics data</h3>
          <p className="text-[#ababab]">Analytics data will appear here once you have promotions.</p>
        </div>
      </div>
    );
  }

  const { summary, typeBreakdown, topPromotions } = analytics;

  return (
    <div className="bg-[#1a1a1a] rounded-lg shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-[#343434]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon size={24} className="text-blue-600" />
            <h2 className="text-lg font-semibold text-[#f5f5f5]">Promotion Analytics</h2>
          </div>
          
          {/* Date Range Filter */}
          <div className="flex items-center space-x-3">
            <div>
              <label className="block text-xs text-[#ababab] mb-1">From</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => handleDateRangeChange('startDate', e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-[#ababab] mb-1">To</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => handleDateRangeChange('endDate', e.target.value)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#f6b100] text-sm font-medium">Total Promotions</p>
                <p className="text-2xl font-bold text-[#f5f5f5]">{summary.totalPromotions || 0}</p>
              </div>
              <TagIcon size={32} className="text-[#f6b100]" />
            </div>
          </div>

          <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-400 text-sm font-medium">Active Promotions</p>
                <p className="text-2xl font-bold text-[#f5f5f5]">{summary.activePromotions || 0}</p>
              </div>
              <TrendingUpIcon size={32} className="text-green-400" />
            </div>
          </div>

          <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-400 text-sm font-medium">Total Usage</p>
                <p className="text-2xl font-bold text-[#f5f5f5]">{summary.totalUsage || 0}</p>
              </div>
              <UsersIcon size={32} className="text-purple-400" />
            </div>
          </div>

          <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#f6b100] text-sm font-medium">Avg Usage</p>
                <p className="text-2xl font-bold text-[#f5f5f5]">
                  {summary.averageUsage ? Math.round(summary.averageUsage * 10) / 10 : 0}
                </p>
              </div>
              <ChartBarIcon size={32} className="text-yellow-400" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Promotion Type Breakdown */}
          <div>
            <h3 className="text-lg font-medium text-[#f5f5f5] mb-4">Promotion Types</h3>
            <div className="space-y-4">
              {typeBreakdown && typeBreakdown.length > 0 ? (
                typeBreakdown.map((type) => (
                  <div key={type._id} className="flex items-center justify-between p-4 bg-[#262626] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(type._id)}`}>
                        {getTypeDisplayName(type._id)}
                      </span>
                      <div>
                        <p className="text-sm font-medium text-[#f5f5f5]">
                          {type.count} promotion{type.count !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-[#ababab]">
                          {type.activeCount} active
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#f5f5f5]">{type.totalUsage}</p>
                      <p className="text-xs text-[#ababab]">total uses</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-[#ababab]">
                  <ChartBarIcon size={32} className="mx-auto mb-2 text-[#ababab]" />
                  <p>No promotion types data available</p>
                </div>
              )}
            </div>
          </div>

          {/* Top Performing Promotions */}
          <div>
            <h3 className="text-lg font-medium text-[#f5f5f5] mb-4">Top Performing Promotions</h3>
            <div className="space-y-4">
              {topPromotions && topPromotions.length > 0 ? (
                topPromotions.map((promotion, index) => (
                  <div key={promotion._id} className="flex items-center justify-between p-4 bg-[#262626] rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 ? 'bg-yellow-400 text-white' : 
                        index === 1 ? 'bg-gray-400 text-white' : 
                        index === 2 ? 'bg-orange-400 text-white' : 'bg-gray-200 text-[#ababab]'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-[#f5f5f5]">{promotion.name}</p>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTypeColor(promotion.type)}`}>
                            {getTypeDisplayName(promotion.type)}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            promotion.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}>
                            {promotion.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[#f5f5f5]">{promotion.usageCount}</p>
                      <p className="text-xs text-[#ababab]">uses</p>
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

        {/* Usage Insights */}
        {summary.totalUsage > 0 && (
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="text-sm font-medium text-blue-900 mb-2">💡 Insights</h4>
            <div className="text-sm text-blue-800 space-y-1">
              {summary.totalPromotions > 0 && (
                <p>
                  • You have {summary.activePromotions} out of {summary.totalPromotions} promotions currently active
                </p>
              )}
              {summary.averageUsage > 0 && (
                <p>
                  • Average promotion usage is {Math.round(summary.averageUsage * 10) / 10} times
                </p>
              )}
              {typeBreakdown && typeBreakdown.length > 0 && (
                <p>
                  • Most popular promotion type: {getTypeDisplayName(typeBreakdown[0]._id)}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromotionAnalytics;
