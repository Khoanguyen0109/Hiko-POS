import PropTypes from 'prop-types';

/**
 * Reusable Loading Spinner Component
 * 
 * Consistent loading indicator across the app using design tokens.
 * 
 * @param {string} size - Spinner size (sm, md, lg)
 * @param {string} className - Additional CSS classes
 */
const LoadingSpinner = ({ 
  size = "md", 
  className = "" 
}) => {
  const sizeClasses = {
    sm: "loading-spinner-sm",
    md: "loading-spinner-md", 
    lg: "loading-spinner-lg"
  };

  const spinnerClasses = `loading-spinner ${sizeClasses[size]} ${className}`;

  return <div className={spinnerClasses} />;
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  className: PropTypes.string
};

export default LoadingSpinner;
