import PropTypes from 'prop-types';

/**
 * Reusable Form Textarea Component
 * 
 * Consistent textarea styling across forms using design tokens.
 * 
 * @param {string} label - Field label text
 * @param {string} value - Textarea value
 * @param {function} onChange - Change handler
 * @param {string} error - Error message to display
 * @param {string} placeholder - Placeholder text
 * @param {boolean} required - Show required asterisk
 * @param {React.ReactNode} icon - Icon to display with label
 * @param {string} helpText - Help text below textarea
 * @param {boolean} disabled - Disable textarea
 * @param {number} rows - Number of rows
 * @param {string} className - Additional CSS classes
 */
const FormTextarea = ({ 
  label, 
  value, 
  onChange, 
  error, 
  placeholder, 
  required = false,
  icon,
  helpText,
  disabled = false,
  rows = 3,
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
      
      {/* Textarea Field */}
      <textarea
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`input-field ${error ? 'input-error' : ''} resize-none`}
        {...props}
      />
      
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

FormTextarea.propTypes = {
  label: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  error: PropTypes.string,
  placeholder: PropTypes.string,
  required: PropTypes.bool,
  icon: PropTypes.node,
  helpText: PropTypes.string,
  disabled: PropTypes.bool,
  rows: PropTypes.number,
  className: PropTypes.string
};

export default FormTextarea;
