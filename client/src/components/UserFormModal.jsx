import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import Input from './ui/input';
import Select from './ui/select';
import MultiSelect from './ui/multi-select';
import { Label } from './ui/label';
import { useSelector } from 'react-redux';
import useOrganisation from '../lib/hooks/useOrganisation';
import { SORTED_INDIAN_STATES } from '../utils/states';

const UserFormModal = ({ open, onOpenChange, onSubmit, initialData = null, mode = 'create' }) => {
    const { organisations ,getOrganisationById,getOrganisations} = useOrganisation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        role: 'SCE_USER',
        orgCode: '',
        status: 'ACTIVE',
        primaryState: '',
        multipleStates: [],
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                password: '', // Don't populate password for edit
                role: initialData.role || 'SCE_USER',
                orgCode: initialData.orgCode || '',
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
        console.log(formData);
        
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

        // Organisation is optional - no validation required

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

    const organisationOptions = [
        { label: 'No Organisation', value: '' },
        ...(organisations?.map((org) => ({
            label: org.name,
            value: org.orgCode,
        })) || [])
    ];

    useEffect(() => {
        getOrganisations({});
    }, []);

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
                            <Input
                                id="password"
                                name="password"
                                type="password"
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

                        {/* Organisation */}
                        <div className="space-y-2">
                            <Label htmlFor="orgCode">
                                Organisation <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Select
                                id="orgCode"
                                name="orgCode"
                                value={formData.orgCode}
                                onChange={handleChange}
                                options={organisationOptions}
                                placeholder="Select organisation (optional)"
                                disabled={isSubmitting}
                                direction="down"
                                className={errors.orgCode ? 'border-red-500' : ''}
                            />
                            {errors.orgCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.orgCode}</p>
                            )}
                        </div>

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
