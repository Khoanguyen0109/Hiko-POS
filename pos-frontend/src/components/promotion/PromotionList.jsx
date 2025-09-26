import React from 'react';
import { 
  MdEdit as PencilIcon, 
  MdDelete as TrashIcon, 
  MdVisibility as EyeIcon,
  MdCheckCircle as CheckCircleIcon,
  MdCancel as XCircleIcon,
  MdSchedule as ClockIcon,
  MdLocalOffer as TagIcon
} from 'react-icons/md';

const PromotionList = ({ 
  promotions, 
  loading, 
  pagination, 
  onEdit, 
  onDelete, 
  onToggleStatus, 
  onPageChange,
  getTypeDisplayName 
}) => {

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Get status badge
  const getStatusBadge = (promotion) => {
    const now = new Date();
    const startDate = new Date(promotion.startDate);
    const endDate = new Date(promotion.endDate);

    if (!promotion.isActive) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
          <XCircleIcon size={12} className="mr-1" />
          Inactive
        </span>
      );
    }

    if (now < startDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <ClockIcon size={12} className="mr-1" />
          Scheduled
        </span>
      );
    }

    if (now > endDate) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircleIcon size={12} className="mr-1" />
          Expired
        </span>
      );
    }

    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircleIcon size={12} className="mr-1" />
        Active
      </span>
    );
  };

  // Get discount display
  const getDiscountDisplay = (promotion) => {
    if (promotion.discount.percentage) {
      return `${promotion.discount.percentage}% OFF`;
    }
    if (promotion.discount.fixedAmount) {
      return `$${promotion.discount.fixedAmount} OFF`;
    }
    return 'N/A';
  };

  // Get applicable items display
  const getApplicableItemsDisplay = (promotion) => {
    switch (promotion.applicableItems) {
      case 'all_order':
        return 'Entire Order';
      case 'specific_dishes':
        return `${promotion.specificDishes?.length || 0} Dishes`;
      case 'categories':
        return `${promotion.categories?.length || 0} Categories`;
      default:
        return 'N/A';
    }
  };

  // Get usage display
  const getUsageDisplay = (promotion) => {
    if (promotion.conditions.usageLimit) {
      return `${promotion.usageCount}/${promotion.conditions.usageLimit}`;
    }
    return promotion.usageCount.toString();
  };

  // Pagination component
  const Pagination = () => {
    if (!pagination || pagination.totalPages <= 1) return null;

    const pages = [];
    const startPage = Math.max(1, pagination.currentPage - 2);
    const endPage = Math.min(pagination.totalPages, pagination.currentPage + 2);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="flex items-center justify-between px-6 py-3 border-t border-[#343434]">
        <div className="flex items-center text-sm text-[#ababab]">
          Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
          {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
          {pagination.totalCount} results
        </div>
        
        <div className="flex items-center space-x-1">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="px-3 py-1 text-sm border border-[#343434] rounded-md hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {pages.map(page => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 text-sm border rounded-md ${
                page === pagination.currentPage
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'border-[#343434] hover:bg-[#262626]'
              }`}
            >
              {page}
            </button>
          ))}
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="px-3 py-1 text-sm border border-[#343434] rounded-md hover:bg-[#262626] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f6b100]"></div>
        <span className="ml-2 text-[#ababab]">Loading promotions...</span>
      </div>
    );
  }

  if (!promotions || promotions.length === 0) {
    return (
      <div className="text-center py-12">
        <TagIcon size={48} className="text-[#ababab] mx-auto mb-4" />
        <h3 className="text-lg font-medium text-[#f5f5f5] mb-2">No promotions found</h3>
        <p className="text-[#ababab]">Create your first promotion to get started.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="min-w-full divide-y divide-[#343434]">
          <thead className="bg-[#262626]">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Promotion
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Type & Discount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Applies To
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Validity
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Usage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-[#ababab] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-[#1a1a1a] divide-y divide-[#343434]">
            {promotions.map((promotion) => (
              <tr key={promotion._id} className="hover:bg-[#262626]">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-[#f5f5f5]">
                      {promotion.name}
                    </div>
                    {promotion.code && (
                      <div className="text-sm text-[#ababab]">
                        Code: {promotion.code}
                      </div>
                    )}
                    {promotion.description && (
                      <div className="text-xs text-[#ababab] mt-1 max-w-xs truncate">
                        {promotion.description}
                      </div>
                    )}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm text-[#f5f5f5]">
                      {getTypeDisplayName(promotion.type)}
                    </div>
                    <div className="text-sm font-medium text-green-600">
                      {getDiscountDisplay(promotion)}
                    </div>
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#f5f5f5]">
                    {getApplicableItemsDisplay(promotion)}
                  </div>
                  {promotion.conditions.minOrderAmount > 0 && (
                    <div className="text-xs text-[#ababab]">
                      Min: ${promotion.conditions.minOrderAmount}
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#f5f5f5]">
                    {formatDate(promotion.startDate)}
                  </div>
                  <div className="text-sm text-[#ababab]">
                    to {formatDate(promotion.endDate)}
                  </div>
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-[#f5f5f5]">
                    {getUsageDisplay(promotion)}
                  </div>
                  {promotion.conditions.usageLimit && (
                    <div className="text-xs text-[#ababab]">
                      {promotion.remainingUsage} remaining
                    </div>
                  )}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap">
                  {getStatusBadge(promotion)}
                </td>
                
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onEdit(promotion)}
                      className="text-blue-600 hover:text-blue-900 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon size={16} />
                    </button>
                    
                    <button
                      onClick={() => onToggleStatus(promotion._id)}
                      className={`transition-colors ${
                        promotion.isActive 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                      title={promotion.isActive ? 'Deactivate' : 'Activate'}
                    >
                      {promotion.isActive ? (
                        <XCircleIcon size={16} />
                      ) : (
                        <CheckCircleIcon size={16} />
                      )}
                    </button>
                    
                    <button
                      onClick={() => onDelete(promotion._id)}
                      className="text-red-600 hover:text-red-900 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4 p-4">
        {promotions.map((promotion) => (
          <div key={promotion._id} className="bg-[#1a1a1a] border border-[#343434] rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-lg font-medium text-[#f5f5f5]">{promotion.name}</h3>
                {promotion.code && (
                  <p className="text-sm text-gray-600">Code: {promotion.code}</p>
                )}
              </div>
              {getStatusBadge(promotion)}
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-[#ababab]">Type</p>
                <p className="font-medium">{getTypeDisplayName(promotion.type)}</p>
              </div>
              <div>
                <p className="text-[#ababab]">Discount</p>
                <p className="font-medium text-green-600">{getDiscountDisplay(promotion)}</p>
              </div>
              <div>
                <p className="text-[#ababab]">Applies To</p>
                <p className="font-medium">{getApplicableItemsDisplay(promotion)}</p>
              </div>
              <div>
                <p className="text-[#ababab]">Usage</p>
                <p className="font-medium">{getUsageDisplay(promotion)}</p>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 mb-4">
              <p>Valid: {formatDate(promotion.startDate)} - {formatDate(promotion.endDate)}</p>
            </div>
            
            {promotion.description && (
              <p className="text-sm text-gray-600 mb-4">{promotion.description}</p>
            )}
            
            <div className="flex items-center justify-between pt-4 border-t border-[#343434]">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onEdit(promotion)}
                  className="flex items-center px-3 py-1 text-sm text-[#f6b100] border border-[#f6b100] rounded-md hover:bg-[#262626] transition-colors"
                >
                  <PencilIcon size={16} className="mr-1" />
                  Edit
                </button>
                
                <button
                  onClick={() => onToggleStatus(promotion._id)}
                  className={`flex items-center px-3 py-1 text-sm border rounded-md transition-colors ${
                    promotion.isActive 
                      ? 'text-red-400 border-red-400 hover:bg-[#262626]' 
                      : 'text-green-400 border-green-400 hover:bg-[#262626]'
                  }`}
                >
                  {promotion.isActive ? (
                    <>
                      <XCircleIcon size={16} className="mr-1" />
                      Deactivate
                    </>
                  ) : (
                    <>
                      <CheckCircleIcon size={16} className="mr-1" />
                      Activate
                    </>
                  )}
                </button>
              </div>
              
              <button
                onClick={() => onDelete(promotion._id)}
                className="flex items-center px-3 py-1 text-sm text-red-400 border border-red-400 rounded-md hover:bg-[#262626] transition-colors"
              >
                <TrashIcon size={16} className="mr-1" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination />
    </div>
  );
};

export default PromotionList;
