import React from 'react';

const Input = ({
  lable,
  type = "text",
  name,
  id,
  value,
  onChange,
  error,
  placeholder,
  icon: Icon, // Expecting a React component for the icon
  className = "",
}) => {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700">
        {lable}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        <input
          type={type}
          name={name}
          id={id}
          value={value}
          onChange={onChange}
          className={`w-full px-3 py-2 border rounded-md shadow-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${Icon ? "pl-10" : ""
            } ${error ? "border-red-500" : "border-gray-300"} ${className}`}
          placeholder={placeholder}
        />
      </div>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default Input;