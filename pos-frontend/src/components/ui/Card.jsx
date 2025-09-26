import PropTypes from 'prop-types';

/**
 * Reusable Card Component
 * 
 * Replaces all hardcoded card styles across the app with consistent design system.
 * Used for OrderCard, DishCard, MenuContainer items, etc.
 * 
 * @param {React.ReactNode} children - Card content
 * @param {string} variant - Card style variant (default, elevated, outlined)
 * @param {string} padding - Card padding (none, sm, md, lg)
 * @param {boolean} hover - Enable hover effects
 * @param {boolean} clickable - Make card clickable (adds cursor pointer)
 * @param {string} className - Additional CSS classes
 * @param {function} onClick - Click handler
 */
const Card = ({ 
  children, 
  variant = "default",
  padding = "md",
  hover = false,
  clickable = false,
  className = "",
  onClick,
  ...props 
}) => {
  // Build CSS classes using our design system
  const baseClasses = "card-base";
  const variantClasses = {
    default: "card-default",
    elevated: "card-elevated", 
    outlined: "card-outlined"
  };
  const paddingClasses = {
    none: "p-0",
    sm: "p-3",
    md: "p-4", 
    lg: "p-6"
  };

  const cardClasses = [
    baseClasses,
    variantClasses[variant],
    paddingClasses[padding],
    hover && "card-hover",
    clickable && "cursor-pointer",
    className
  ].filter(Boolean).join(" ");

  return (
    <div
      className={cardClasses}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'elevated', 'outlined']),
  padding: PropTypes.oneOf(['none', 'sm', 'md', 'lg']),
  hover: PropTypes.bool,
  clickable: PropTypes.bool,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Card;
