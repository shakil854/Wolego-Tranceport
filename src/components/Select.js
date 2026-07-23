import React from 'react';

const Select = ({ label, name, id, value, onChange, placeholder, options = [], className = "" }) => {
    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={name} className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            
            <select
                name={name}
                id={id}
                value={value}
                onChange={onChange}
                className={`w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent ${className}`}
            >
                {placeholder && (
                    <option value="" disabled>
                        {placeholder}
                    </option>
                )}
                {options.map((option, index) => (
                    <option key={index} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default Select;