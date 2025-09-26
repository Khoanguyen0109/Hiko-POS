import PropTypes from 'prop-types';

/**
 * Reusable Form Select Component
 * 
 * Replaces all hardcoded select styles across forms with consistent design system.
 * Used in PromotionForm, MemberModal, and other forms.
 * 
 * @param {string} label - Field label text
 * @param {string} value - Selected value
 * @param {function} onChange - Change handler
 * @param {Array} options - Array of {value, label} options
 * @param {string} error - Error message to display
 * @param {string} placeholder - Placeholder option text
 * @param {boolean} required - Show required asterisk
 * @param {React.ReactNode} icon - Icon to display with label
 * @param {string} helpText - Help text below select
 * @param {boolean} disabled - Disable select
 * @param {string} className - Additional CSS classes
 */
const FormSelect = ({ 
  label, 
  value, 
  onChange, 
  options = [],
  error, 
  placeholder = "Select an option",
  required = false,
  icon,
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
      
      {/* Select Field */}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`input-field ${error ? 'input-error' : ''}`}
        {...props}
      >
        {/* Placeholder Option */}
        <option value="" disabled>
          {placeholder}
        </option>
        
        {/* Options */}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
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

FormSelect.propTypes = {
  label: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired
    })
  ).isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  icon: PropTypes.node,
  helpText: PropTypes.string,
  disabled: PropTypes.bool,
  className: PropTypes.string
};

export default FormSelect;
