import React from 'react';

const Spinner = ({ size = 'medium', className = '' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
  };

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`${sizeClasses[size]} border-4 border-blue-500 border-t-transparent rounded-full animate-spin`}
      ></div>
    </div>
  );
};

export default Spinner;
