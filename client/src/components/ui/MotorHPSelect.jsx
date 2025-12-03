import React, { useEffect } from 'react';
import { useMotorHPOptions } from '../../lib/hooks/useMotorHPOptions';
import { Wrench, Loader2 } from 'lucide-react';

/**
 * MotorHP Select Component
 * A reusable dropdown component for selecting motor HP values
 * 
 * Props:
 * - value: Selected motor HP ID
 * - onChange: Callback function when selection changes
 * - placeholder: Placeholder text (default: "Select Motor HP")
 * - className: Additional CSS classes
 * - disabled: Whether the select is disabled
 * - required: Whether the select is required
 * - name: HTML name attribute
 * - id: HTML id attribute
 * - showValue: Whether to show the HP value along with label (default: true)
 * - autoSelectByHp: HP value to automatically select if found (optional)
 */
const MotorHPSelect = ({
    value,
    onChange,
    placeholder = "Select Motor HP",
    className = "",
    disabled = false,
    required = false,
    name,
    id,
    showValue = true,
    autoSelectByHp = null,
    ...props
}) => {
    const { motorhpOptions, loading, error, refetch } = useMotorHPOptions();

    // Auto-select option based on HP value
    useEffect(() => {
        if (autoSelectByHp && motorhpOptions.length > 0 && !value) {
            const hpValue = parseInt(autoSelectByHp);
            if (!isNaN(hpValue)) {
                const matchingOption = motorhpOptions.find(option => option.value === hpValue);
                if (matchingOption && onChange) {
                    onChange(matchingOption.id, matchingOption);
                }
            }
        }
    }, [autoSelectByHp, motorhpOptions, value, onChange]);

    const handleChange = (e) => {
        const selectedId = e.target.value;
        const selectedMotorHP = motorhpOptions.find(option => option.id.toString() === selectedId);
        
        if (onChange) {
            onChange(selectedId ? parseInt(selectedId) : null, selectedMotorHP);
        }
    };

    if (error) {
        return (
            <div className="relative">
                <select
                    className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 border-red-300 bg-red-50 text-red-700 ${className}`}
                    disabled
                >
                    <option>Error loading Motor HP options</option>
                </select>
                <button
                    type="button"
                    onClick={refetch}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-red-600 hover:text-red-800"
                    title="Retry loading options"
                >
                    <Wrench className="h-4 w-4" />
                </button>
            </div>
        );
    }

    return (
        <div className="relative">
            <select
                id={id}
                name={name}
                value={value || ''}
                onChange={handleChange}
                disabled={disabled || loading}
                required={required}
                className={`w-full px-2.5 xs:px-3 sm:px-4 py-1.5 xs:py-2 sm:py-2.5 lg:py-3 border rounded-md xs:rounded-lg text-xs xs:text-sm sm:text-base focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 ${
                    disabled || loading ? 'bg-gray-100 text-gray-400' : 'bg-white'
                } border-gray-300 ${className}`}
                {...props}
            >
                <option value="">{loading ? 'Loading...' : placeholder}</option>
                {motorhpOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                        {showValue ? `${option.label} (${option.value}HP)` : option.label}
                    </option>
                ))}
            </select>
            
            {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
            )}
        </div>
    );
};

export default MotorHPSelect;