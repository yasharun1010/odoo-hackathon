import React from 'react';

const Input = ({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
          ${error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-gray-300 focus:ring-blue-200'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Input;
