import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSnackbar } from 'notistack';
import PromotionList from '../components/promotion/PromotionList';
import PromotionForm from '../components/promotion/PromotionForm';
import PromotionAnalytics from '../components/promotion/PromotionAnalytics';
import { 
  fetchPromotions,
  fetchAnalytics,
  createPromotion,
  editPromotion,
  removePromotion,
  toggleStatus,
  setFilters,
  clearError,
  clearAnalyticsError
} from '../redux/slices/promotionSlice';
import { 
  MdAdd as PlusIcon, 
  MdBarChart as ChartBarIcon, 
  MdLocalOffer as TagIcon,
  MdSchedule as ClockIcon,
  MdCheckCircle as CheckCircleIcon,
  MdCancel as XCircleIcon
} from 'react-icons/md';

const PromotionManager = () => {
  const dispatch = useDispatch();
  const { enqueueSnackbar } = useSnackbar();
  
  // Redux state
  const {
    items: promotions,
    loading,
    error,
    filters,
    totalPages,
    currentPage,
    totalItems,
    analytics,
    analyticsLoading,
    analyticsError
  } = useSelector(state => state.promotions);
  
  // Local UI state
  const [showForm, setShowForm] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);

  // Effects
  useEffect(() => {
    dispatch(fetchPromotions(filters));
  }, [dispatch, filters]);

  useEffect(() => {
    if (showAnalytics && !analytics) {
      dispatch(fetchAnalytics());
    }
  }, [dispatch, showAnalytics, analytics]);

  // Handle errors
  useEffect(() => {
    if (error) {
      enqueueSnackbar(error, { variant: 'error' });
      dispatch(clearError());
    }
  }, [error, enqueueSnackbar, dispatch]);

  useEffect(() => {
    if (analyticsError) {
      enqueueSnackbar(analyticsError, { variant: 'error' });
      dispatch(clearAnalyticsError());
    }
  }, [analyticsError, enqueueSnackbar, dispatch]);

  // Handle create/update promotion
  const handlePromotionSubmit = async (promotionData) => {
    try {
      let result;
      if (editingPromotion) {
        result = await dispatch(editPromotion({ 
          promotionId: editingPromotion._id, 
          ...promotionData 
        })).unwrap();
        enqueueSnackbar('Promotion updated successfully!', { variant: 'success' });
      } else {
        result = await dispatch(createPromotion(promotionData)).unwrap();
        enqueueSnackbar('Promotion created successfully!', { variant: 'success' });
      }
      setShowForm(false);
      setEditingPromotion(null);
    } catch (error) {
      // Error is already handled by Redux and useEffect
    }
  };

  // Handle delete promotion
  const handleDeletePromotion = async (promotionId) => {
    if (!window.confirm('Are you sure you want to delete this promotion?')) {
      return;
    }

    try {
      await dispatch(removePromotion(promotionId)).unwrap();
      enqueueSnackbar('Promotion deleted successfully!', { variant: 'success' });
    } catch (error) {
      // Error is already handled by Redux and useEffect
    }
  };

  // Handle toggle promotion status
  const handleToggleStatus = async (promotionId) => {
    try {
      await dispatch(toggleStatus(promotionId)).unwrap();
      enqueueSnackbar('Promotion status updated successfully!', { variant: 'success' });
    } catch (error) {
      // Error is already handled by Redux and useEffect
    }
  };

  // Handle edit promotion
  const handleEditPromotion = (promotion) => {
    setEditingPromotion(promotion);
    setShowForm(true);
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    dispatch(setFilters({
      [key]: value,
      page: key !== 'page' ? 1 : value // Reset page when other filters change
    }));
  };

  // Get promotion type display name
  const getTypeDisplayName = (type) => {
    const typeMap = {
      'order_percentage': 'Order Percentage',
      'order_fixed': 'Order Fixed Amount',
      'item_percentage': 'Item Percentage',
      'item_fixed': 'Item Fixed Amount',
      'happy_hour': 'Happy Hour'
    };
    return typeMap[type] || type;
  };

  // Get promotion status counts
  const statusCounts = promotions.reduce((acc, promotion) => {
    if (promotion.isActive) {
      acc.active += 1;
    } else {
      acc.inactive += 1;
    }
    return acc;
  }, { active: 0, inactive: 0 });

  return (
    <div className="min-h-screen bg-[#1f1f1f] pb-20">
      <div className="container mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434] p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <TagIcon size={32} className="text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-[#f5f5f5]">Promotion Manager</h1>
                <p className="text-[#ababab]">Manage your restaurant promotions and discounts</p>
              </div>
            </div>
            
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowAnalytics(!showAnalytics)}
                  className="flex items-center px-4 py-2 bg-[#1f1f1f] hover:bg-[#262626] text-[#f5f5f5] rounded-lg border border-[#343434] transition-colors"
                >
                  <ChartBarIcon size={20} className="mr-2" />
                  Analytics
                </button>
                
                <button
                  onClick={() => {
                    setEditingPromotion(null);
                    setShowForm(true);
                  }}
                  className="flex items-center px-4 py-2 bg-[#f6b100] hover:bg-[#e6a000] text-[#1f1f1f] rounded-lg font-semibold transition-colors"
                >
                  <PlusIcon size={20} className="mr-2" />
                  New Promotion
                </button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#f6b100] text-sm font-medium">Total Promotions</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">{promotions.length}</p>
                </div>
                <TagIcon size={32} className="text-[#f6b100]" />
              </div>
            </div>

            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-400 text-sm font-medium">Active</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">{statusCounts.active}</p>
                </div>
                <CheckCircleIcon size={32} className="text-green-400" />
              </div>
            </div>

            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-400 text-sm font-medium">Inactive</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">{statusCounts.inactive}</p>
                </div>
                <XCircleIcon size={32} className="text-red-400" />
              </div>
            </div>

            <div className="bg-[#262626] p-4 rounded-lg border border-[#343434]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[#f6b100] text-sm font-medium">Total Usage</p>
                  <p className="text-2xl font-bold text-[#f5f5f5]">
                    {promotions.reduce((sum, p) => sum + p.usageCount, 0)}
                  </p>
                </div>
                <ClockIcon size={32} className="text-[#f6b100]" />
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Section */}
        {showAnalytics && (
          <div className="mb-6">
            <PromotionAnalytics 
              analytics={analytics}
              loading={analyticsLoading}
            />
          </div>
        )}

        {/* Main Content */}
        <div className="bg-[#1a1a1a] rounded-lg border border-[#343434]">
          {/* Filters */}
          <div className="p-6 border-b border-[#343434]">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Search
                </label>
                <input
                  type="text"
                  placeholder="Search promotions..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] placeholder-[#ababab] focus:outline-none focus:border-[#f6b100]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Status
                </label>
                <select
                  value={filters.isActive}
                  onChange={(e) => handleFilterChange('isActive', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                >
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                >
                  <option value="">All Types</option>
                  <option value="order_percentage">Order Percentage</option>
                  <option value="order_fixed">Order Fixed Amount</option>
                  <option value="item_percentage">Item Percentage</option>
                  <option value="item_fixed">Item Fixed Amount</option>
                  <option value="happy_hour">Happy Hour</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[#f5f5f5] mb-2">
                  Per Page
                </label>
                <select
                  value={filters.limit}
                  onChange={(e) => handleFilterChange('limit', e.target.value)}
                  className="w-full px-3 py-2 bg-[#262626] border border-[#343434] rounded-md text-[#f5f5f5] focus:outline-none focus:border-[#f6b100]"
                >
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>
            </div>
          </div>

          {/* Promotion List */}
          <PromotionList
            promotions={promotions}
            loading={loading}
            pagination={{
              totalPages,
              currentPage,
              totalItems
            }}
            onEdit={handleEditPromotion}
            onDelete={handleDeletePromotion}
            onToggleStatus={handleToggleStatus}
            onPageChange={(page) => handleFilterChange('page', page)}
            getTypeDisplayName={getTypeDisplayName}
          />
        </div>

        {/* Promotion Form Modal */}
        {showForm && (
          <PromotionForm
            promotion={editingPromotion}
            onSubmit={handlePromotionSubmit}
            onClose={() => {
              setShowForm(false);
              setEditingPromotion(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default PromotionManager;

