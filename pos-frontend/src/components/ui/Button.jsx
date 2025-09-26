import PropTypes from 'prop-types';
import LoadingSpinner from './LoadingSpinner';

/**
 * Reusable Button Component
 * 
 * Replaces all hardcoded button styles across the app with a consistent design system.
 * Uses CSS custom properties from tokens.css for theming.
 * 
 * @param {string} variant - Button style variant (primary, secondary, danger, ghost, success)
 * @param {string} size - Button size (sm, md, lg)
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} disabled - Disable button
 * @param {React.ReactNode} icon - Icon to display
 * @param {string} iconPosition - Icon position (left, right)
 * @param {string} className - Additional CSS classes
 * @param {React.ReactNode} children - Button content
 */
const Button = ({ 
  variant = "primary", 
  size = "md", 
  children, 
  loading = false, 
  disabled = false,
  icon,
  iconPosition = "left",
  className = "",
  type = "button",
  ...props 
}) => {
  // Build CSS classes using our design system
  const baseClasses = "btn-base";
  const variantClasses = {
    primary: "btn-primary",
    secondary: "btn-secondary", 
    danger: "btn-danger",
    ghost: "btn-ghost",
    success: "btn-success"
  };
  const sizeClasses = {
    sm: "btn-sm",
    md: "btn-md", 
    lg: "btn-lg"
  };

  const buttonClasses = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      {...props}
    >
      {/* Loading State */}
      {loading && <LoadingSpinner size="sm" className="mr-2" />}
      
      {/* Left Icon */}
      {!loading && icon && iconPosition === "left" && (
        <span className="mr-2 flex items-center">
          {icon}
        </span>
      )}
      
      {/* Button Content */}
      {children}
      
      {/* Right Icon */}
      {!loading && icon && iconPosition === "right" && (
        <span className="ml-2 flex items-center">
          {icon}
        </span>
      )}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  children: PropTypes.node.isRequired,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  onClick: PropTypes.func
};

export default Button;
