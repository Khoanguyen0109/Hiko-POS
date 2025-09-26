import PropTypes from 'prop-types';
import { FaCircle, FaCheckDouble, FaClock, FaTimes, FaExclamationTriangle } from 'react-icons/fa';

/**
 * Reusable Status Badge Component
 * 
 * Consistent status indicators across the app using design tokens.
 * Handles order statuses, payment statuses, and other status types.
 * 
 * @param {string} status - Status value (ready, completed, progress, pending, cancelled, etc.)
 * @param {string} type - Badge type (order, payment, promotion, etc.)
 * @param {string} size - Badge size (sm, md, lg)
 * @param {boolean} showIcon - Show status icon
 * @param {boolean} showText - Show status text
 * @param {string} customText - Custom text override
 * @param {string} className - Additional CSS classes
 */
const StatusBadge = ({ 
  status, 
  type = "order",
  size = "md",
  showIcon = true,
  showText = true,
  customText,
  className = ""
}) => {
  // Status configuration for different types
  const statusConfig = {
    order: {
      ready: { 
        color: "success", 
        icon: FaCheckDouble, 
        text: "Ready to serve" 
      },
      completed: { 
        color: "success", 
        icon: FaCheckDouble, 
        text: "Order completed" 
      },
      progress: { 
        color: "info", 
        icon: FaClock, 
        text: "Preparing your order" 
      },
      pending: { 
        color: "warning", 
        icon: FaClock, 
        text: "Order received" 
      },
      cancelled: { 
        color: "error", 
        icon: FaTimes, 
        text: "Order cancelled" 
      }
    },
    payment: {
      paid: { 
        color: "success", 
        icon: FaCheckDouble, 
        text: "Paid" 
      },
      pending: { 
        color: "warning", 
        icon: FaClock, 
        text: "Payment pending" 
      },
      failed: { 
        color: "error", 
        icon: FaTimes, 
        text: "Payment failed" 
      },
      refunded: { 
        color: "info", 
        icon: FaExclamationTriangle, 
        text: "Refunded" 
      }
    },
    promotion: {
      active: { 
        color: "success", 
        icon: FaCheckDouble, 
        text: "Active" 
      },
      inactive: { 
        color: "error", 
        icon: FaTimes, 
        text: "Inactive" 
      },
      expired: { 
        color: "warning", 
        icon: FaExclamationTriangle, 
        text: "Expired" 
      },
      scheduled: { 
        color: "info", 
        icon: FaClock, 
        text: "Scheduled" 
      }
    }
  };

  // Get configuration for current status
  const config = statusConfig[type]?.[status?.toLowerCase()] || {
    color: "warning",
    icon: FaExclamationTriangle,
    text: status || "Unknown"
  };

  const IconComponent = config.icon;
  const displayText = customText || config.text;

  // Size classes
  const sizeClasses = {
    sm: "badge-sm text-xs",
    md: "badge-md text-sm", 
    lg: "px-3 py-2 text-base"
  };

  const iconSizes = {
    sm: 10,
    md: 12,
    lg: 16
  };

  const badgeClasses = `badge badge-${config.color} ${sizeClasses[size]} ${className}`;

  return (
    <span className={badgeClasses}>
      {showIcon && IconComponent && (
        <IconComponent 
          size={iconSizes[size]} 
          className={showText ? "mr-1" : ""} 
        />
      )}
      {showText && displayText}
    </span>
  );
};

StatusBadge.propTypes = {
  status: PropTypes.string.isRequired,
  type: PropTypes.oneOf(['order', 'payment', 'promotion']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  showIcon: PropTypes.bool,
  showText: PropTypes.bool,
  customText: PropTypes.string,
  className: PropTypes.string
};

export default StatusBadge;
