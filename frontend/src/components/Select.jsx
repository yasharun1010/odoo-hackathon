import React from 'react';

const Select = ({
  name,
  id,
  label,
  value,
  onChange,
  options,
  placeholder = 'Select an option',
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  const selectId = id || name;

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        id={selectId}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        required={required}
        className={`
          w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2
          appearance-none bg-white cursor-pointer
          ${error 
            ? 'border-red-500 focus:ring-red-200' 
            : 'border-gray-300 focus:ring-blue-200 hover:border-blue-400'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%236B7280'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 0.75rem center',
          backgroundSize: '1em'
        }}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options && options.length > 0 ? (
          options.map((option, index) => (
            <option key={`${option.value}-${index}`} value={option.value}>
              {option.label}
            </option>
          ))
        ) : (
          <option disabled>No options available</option>
        )}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default Select;
