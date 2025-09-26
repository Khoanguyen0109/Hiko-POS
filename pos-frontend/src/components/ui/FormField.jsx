import PropTypes from 'prop-types';

/**
 * Reusable Form Field Component
 * 
 * Replaces all hardcoded input styles across forms with consistent design system.
 * Used in PromotionForm, MemberModal, Register, Login, etc.
 * 
 * @param {string} label - Field label text
 * @param {string} type - Input type (text, email, password, number, etc.)
 * @param {string} value - Input value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Show required asterisk
 * @param {React.ReactNode} icon - Icon to display with label
 * @param {string} prefix - Prefix text/symbol (e.g., "$", "₫")
 * @param {string} suffix - Suffix text/symbol (e.g., "%", "kg")
 * @param {string} helpText - Help text below input
 * @param {boolean} disabled - Disable input
 * @param {string} className - Additional CSS classes
 */
const FormField = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  error, 
  placeholder, 
  required = false,
  icon,
  prefix,
  suffix,
  helpText,
  disabled = false,
  className = "",
  ...props 
}) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-[#ababab] mb-2">
          {icon && <span className="inline mr-2 text-base">{icon}</span>}
          {label} 
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Input Container */}
      <div className="relative">
        {/* Prefix */}
        {prefix && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#ababab] text-sm">
            {prefix}
          </span>
        )}
        
        {/* Input Field */}
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`input-field ${error ? 'input-error' : ''} ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-8' : ''}`}
          {...props}
        />
        
        {/* Suffix */}
        {suffix && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#ababab] text-sm">
            {suffix}
          </span>
        )}
      </div>
      
      {/* Error Message */}
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center">
          <span className="mr-1">⚠️</span>
          {error}
        </p>
      )}
      
      {/* Help Text */}
      {helpText && !error && (
        <p className="text-[#ababab] text-sm mt-1">
          {helpText}
        </p>
      )}
    </div>
  );
};

FormField.propTypes = {
  label: PropTypes.string,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  icon: PropTypes.node,
  prefix: PropTypes.string,
  suffix: PropTypes.string,
  helpText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default FormField;
