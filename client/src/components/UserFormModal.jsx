import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import Input from './ui/input';
import PasswordInput from './ui/password-input';
import Select from './ui/select';
import MultiSelect from './ui/multi-select';
import { Label } from './ui/label';
import { useSelector } from 'react-redux';
import useOrganisation from '../lib/hooks/useOrganisation';
import useServiceCenter from '../lib/hooks/useServiceCenter';
import { SORTED_INDIAN_STATES } from '../utils/states';

const UserFormModal = ({ open, onOpenChange, onSubmit, initialData = null, mode = 'create' }) => {
    const { organisations ,getOrganisationById,getOrganisations} = useOrganisation();
    const { serviceCenters, getServiceCenters } = useServiceCenter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'SCE_USER',
        orgCode: '',
        centerCode: '',
        status: 'ACTIVE',
        primaryState: '',
        multipleStates: [],
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            // Handle both orgCode and centerCode from initialData
            // If the user has a centerCode, they're likely a service center technician
            // If they have orgCode, they're likely customer-related roles
            const hasExistingServiceCenter = initialData.centerCode;
            const hasExistingCustomer = initialData.orgCode;
            
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                password: '', // Don't populate password for edit
                role: initialData.role || 'SCE_USER',
                orgCode: hasExistingCustomer ? initialData.orgCode : '',
                centerCode: hasExistingServiceCenter ? initialData.centerCode : '',
                status: initialData.status || 'ACTIVE',
                primaryState: initialData.primaryState || '',
                multipleStates: initialData.multipleStates || [],
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                password: '',
                role: 'SCE_USER',
                orgCode: '',
                centerCode: '',
                status: 'ACTIVE',
                primaryState: '',
                multipleStates: [],
            });
        }
        setErrors({});
    }, [initialData, open]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors((prev) => ({
                ...prev,
                [name]: '',
            }));
        }
    };

    const validateForm = () => {        
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        // Email is optional, but if provided, must be valid
        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        if (!formData.phone.trim()) {
            newErrors.phone = 'Phone number is required';
        }

        if (mode === 'create' && !formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.role) {
            newErrors.role = 'Role is required';
        }

        // Validate organisation/customer selection for specific roles
        if (['CUSTOMER_SERVICE_HEAD', 'CUSTOMER_FIELD_ENGINEER', 'SERVICE_CENTER_TECHNICIAN'].includes(formData.role)) {
            if (formData.role === 'SERVICE_CENTER_TECHNICIAN') {
                if (!formData.centerCode.trim()) {
                    newErrors.centerCode = 'Service Center is required for this role';
                }
            } else {
                if (!formData.orgCode.trim()) {
                    newErrors.orgCode = 'Customer is required for this role';
                }
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleClose = () => {
        setFormData({
            name: '',
            email: '',
            phone: '',
            password: '',
            role: 'SCE_USER',
            orgCode: '',
            centerCode: '',
            status: 'ACTIVE',
            primaryState: '',
            multipleStates: [],
        });
        setErrors({});
        onOpenChange(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = { ...formData };
            // Remove password field if empty (for edit mode)
            if (!submitData.password) {
                delete submitData.password;
            }
            
            // Clean up data based on role - only send relevant field
            if (formData.role === 'SERVICE_CENTER_TECHNICIAN') {
                delete submitData.orgCode; // Remove orgCode for service center technicians
            } else {
                delete submitData.centerCode; // Remove centerCode for non-service center roles
            }
            
            await onSubmit(submitData);
            handleClose();
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const roleOptions = [
        { label: 'Macsoft Admin', value: 'MACSOFT_ADMIN' },
        { label: 'Macsoft Head', value: 'MACSOFT_HEAD' },
        { label: 'Macsoft Support', value: 'MACSOFT_SUPPORT' },
        { label: 'Customer Service Head', value: 'CUSTOMER_SERVICE_HEAD' },
        { label: 'Service Center Technician', value: 'SERVICE_CENTER_TECHNICIAN' },
        { label: 'Customer Field Engineer', value: 'CUSTOMER_FIELD_ENGINEER' },
    ];

    const statusOptions = [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
    ];

    // Determine if role should show organization/customer selection
    const shouldShowOrganisation = () => {
        const macsoftRoles = ['MACSOFT_ADMIN', 'MACSOFT_HEAD', 'MACSOFT_SUPPORT'];
        return !macsoftRoles.includes(formData.role);
    };

    // Determine the label and options based on role
    const getOrganisationConfig = () => {
        if (formData.role === 'SERVICE_CENTER_TECHNICIAN') {
            return {
                label: 'Service Center',
                placeholder: 'Select service center',
                noSelectionLabel: 'No Service Center'
            };
        } else if (['CUSTOMER_SERVICE_HEAD', 'CUSTOMER_FIELD_ENGINEER'].includes(formData.role)) {
            return {
                label: 'Customer',
                placeholder: 'Select customer',
                noSelectionLabel: 'No Customer'
            };
        } else {
            return {
                label: 'Customer',
                placeholder: 'Select customer (optional)',
                noSelectionLabel: 'No Customer'
            };
        }
    };

    const orgConfig = getOrganisationConfig();
    
    // Use service centers for SERVICE_CENTER_TECHNICIAN, otherwise use organisations
    const getOptionsData = () => {
        if (formData.role === 'SERVICE_CENTER_TECHNICIAN') {
            return serviceCenters?.map((center) => ({
                label: center.name,
                value: center.centerCode,
            })) || [];
        }
        return organisations?.map((org) => ({
            label: org.name,
            value: org.orgCode,
        })) || [];
    };
    
    const organisationOptions = [
        { label: orgConfig.noSelectionLabel, value: '' },
        ...getOptionsData()
    ];

    useEffect(() => {
        getOrganisations({});
        getServiceCenters({});
    }, []);

    // Additional useEffect to fetch service centers when role changes to SERVICE_CENTER_TECHNICIAN
    useEffect(() => {
        if (formData.role === 'SERVICE_CENTER_TECHNICIAN') {
            getServiceCenters({});
        }
    }, [formData.role]);

    // Handle role changes - clear inappropriate field and preserve existing value if switching back
    useEffect(() => {
        // Don't run on initial mount or when initialData is being set
        if (!initialData) {
            if (formData.role === 'SERVICE_CENTER_TECHNICIAN') {
                // Clear orgCode when switching to service center technician
                if (formData.orgCode) {
                    setFormData(prev => ({ ...prev, orgCode: '' }));
                }
            } else {
                // Clear centerCode when switching away from service center technician
                if (formData.centerCode) {
                    setFormData(prev => ({ ...prev, centerCode: '' }));
                }
            }
        }
    }, [formData.role, initialData]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto select-none">
                <DialogHeader>
                    <DialogTitle className="uppercase">
                        {mode === 'create' ? 'Create New User' : 'Edit User'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter user name"
                                disabled={isSubmitting}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address (optional)"
                                disabled={isSubmitting}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone */}
                        <div className="space-y-2">
                            <Label htmlFor="phone">
                                Phone Number <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number"
                                disabled={isSubmitting}
                                className={errors.phone ? 'border-red-500' : ''}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label htmlFor="password">
                                Password {mode === 'create' && <span className="text-red-500">*</span>}
                                {mode === 'edit' && <span className="text-xs text-gray-500">(leave blank to keep current)</span>}
                            </Label>
                            <PasswordInput
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={mode === 'create' ? 'Enter password' : 'Leave blank to keep current'}
                                disabled={isSubmitting}
                                className={errors.password ? 'border-red-500' : ''}
                            />
                            {errors.password && (
                                <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                            )}
                        </div>

                        {/* Role */}
                        <div className="space-y-2">
                            <Label htmlFor="role">
                                Role <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                options={roleOptions}
                                placeholder="Select role"
                                disabled={isSubmitting}
                                direction="down"
                                className={errors.role ? 'border-red-500' : ''}
                            />
                            {errors.role && (
                                <p className="text-red-500 text-xs mt-1">{errors.role}</p>
                            )}
                        </div>

                        {/* Customer/Service Center - Only show for non-Macsoft roles */}
                        {shouldShowOrganisation() && (
                            <div className="space-y-2">
                                <Label htmlFor={formData.role === 'SERVICE_CENTER_TECHNICIAN' ? 'centerCode' : 'orgCode'}>
                                    {orgConfig.label}
                                    {['CUSTOMER_SERVICE_HEAD', 'CUSTOMER_FIELD_ENGINEER', 'SERVICE_CENTER_TECHNICIAN'].includes(formData.role) ? (
                                        <span className="text-red-500"> *</span>
                                    ) : (
                                        <span className="text-xs text-gray-500"> (optional)</span>
                                    )}
                                </Label>
                                <Select
                                    id={formData.role === 'SERVICE_CENTER_TECHNICIAN' ? 'centerCode' : 'orgCode'}
                                    name={formData.role === 'SERVICE_CENTER_TECHNICIAN' ? 'centerCode' : 'orgCode'}
                                    value={formData.role === 'SERVICE_CENTER_TECHNICIAN' ? (formData.centerCode || '') : (formData.orgCode || '')}
                                    onChange={handleChange}
                                    options={organisationOptions}
                                    placeholder={orgConfig.placeholder}
                                    disabled={isSubmitting}
                                    direction="down"
                                    className={(formData.role === 'SERVICE_CENTER_TECHNICIAN' ? errors.centerCode : errors.orgCode) ? 'border-red-500' : ''}
                                />
                                {(formData.role === 'SERVICE_CENTER_TECHNICIAN' ? errors.centerCode : errors.orgCode) && (
                                    <p className="text-red-500 text-xs mt-1">{formData.role === 'SERVICE_CENTER_TECHNICIAN' ? errors.centerCode : errors.orgCode}</p>
                                )}
                            </div>
                        )}

                        {/* Status */}
                        <div className="space-y-2">
                            <Label htmlFor="status">
                                Status <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                id="status"
                                name="status"
                                value={formData.status}
                                onChange={handleChange}
                                options={statusOptions}
                                placeholder="Select status"
                                disabled={isSubmitting}
                                direction="down"
                                className={errors.status ? 'border-red-500' : ''}
                            />
                            {errors.status && (
                                <p className="text-red-500 text-xs mt-1">{errors.status}</p>
                            )}
                        </div>

                        {/* Primary State */}
                        <div className="space-y-2">
                            <Label htmlFor="primaryState">
                                Primary State <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Select
                                id="primaryState"
                                name="primaryState"
                                value={formData.primaryState}
                                onChange={handleChange}
                                options={SORTED_INDIAN_STATES}
                                placeholder="Select primary state (optional)"
                                disabled={isSubmitting}
                                direction="down"
                                className={errors.primaryState ? 'border-red-500' : ''}
                            />
                            {errors.primaryState && (
                                <p className="text-red-500 text-xs mt-1">{errors.primaryState}</p>
                            )}
                        </div>

                        {/* Multiple States */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="multipleStates">
                                Additional States <span className="text-xs text-gray-500">(optional, multiple selection)</span>
                            </Label>
                            <MultiSelect
                                id="multipleStates"
                                name="multipleStates"
                                value={formData.multipleStates}
                                onChange={handleChange}
                                options={SORTED_INDIAN_STATES}
                                placeholder="Select additional states (optional)"
                                disabled={isSubmitting}
                                direction="down"
                                className={errors.multipleStates ? 'border-red-500' : ''}
                                maxSelectedDisplay={2}
                            />
                            {errors.multipleStates && (
                                <p className="text-red-500 text-xs mt-1">{errors.multipleStates}</p>
                            )}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                                if (!isSubmitting) {
                                    handleClose();
                                }
                            }}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    {mode === 'create' ? 'Creating...' : 'Updating...'}
                                </>
                            ) : (
                                mode === 'create' ? 'Create User' : 'Update User'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default UserFormModal;
