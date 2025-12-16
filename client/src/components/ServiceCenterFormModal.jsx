import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import Input from './ui/input';
import Select from './ui/select';
import { Label } from './ui/label';
 import useOrganisation from '../lib/hooks/useOrganisation';

const ServiceCenterFormModal = ({ open, onOpenChange, onSubmit, initialData = null, mode = 'create' }) => {
         const {organisations, getOrganisations } = useOrganisation();
    const [formData, setFormData] = useState({
        name: '',
        orgCode: '',
        centerCode: '',
        email: '',
        address: '',
        serviceableStates: '',
        isActive: true,
        isMacsoft: false,
        isMacsoftHead: false,
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch organisations for dropdown when modal opens
    useEffect(() => {
        if (open) {
            getOrganisations({ skip: 0, take: 1000 });
        }
    }, [open, getOrganisations]);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                orgCode: initialData.orgCode || '',
                centerCode: initialData.centerCode || '',
                email: initialData.email || '',
                address: initialData.address || '',
                serviceableStates: initialData.serviceableStates || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
                isMacsoft: initialData.isMacsoft !== undefined ? initialData.isMacsoft : false,
                isMacsoftHead: initialData.isMacsoftHead !== undefined ? initialData.isMacsoftHead : false,
            });
        } else {
            setFormData({
                name: '',
                orgCode: '',
                centerCode: '',
                email: '',
                address: '',
                serviceableStates: '',
                isActive: true,
                isMacsoft: false,
                isMacsoftHead: false,
            });
        }
        setErrors({});
    }, [initialData, open]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value,
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
            newErrors.name = 'Service Center name is required';
        }

        if (!formData.centerCode.trim()) {
            newErrors.centerCode = 'Center code is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // orgCode is optional, no validation needed
        // address is optional, no validation needed

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await onSubmit(formData);
            // Don't call handleClose() here - let parent component handle modal closing
        } catch (error) {
            console.error('Form submission error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Prepare organisation options for dropdown
    const organisationOptions = organisations?.map(org => ({
        label: `${org.name} (${org.orgCode})`,
        value: org.orgCode
    })) || [];

    // Add empty option for optional organisation
    organisationOptions.unshift({ label: 'No Customer', value: '' });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
                <DialogHeader>
                    <DialogTitle className="uppercase">
                        {mode === 'create' ? 'Create New Service Center' : 'Edit Service Center'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Service Center Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Service Center Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter service center name"
                                disabled={isSubmitting}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Center Code */}
                        <div className="space-y-2">
                            <Label htmlFor="centerCode">
                                Center Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="centerCode"
                                name="centerCode"
                                value={formData.centerCode}
                                onChange={handleChange}
                                placeholder="Enter unique center code"
                                disabled={isSubmitting}
                                className={errors.centerCode ? 'border-red-500' : ''}
                            />
                            {errors.centerCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.centerCode}</p>
                            )}
                        </div>

                        {/* Customer */}
                        <div className="space-y-2">
                            <Label htmlFor="orgCode">
                                Customer <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Select
                                id="orgCode"
                                name="orgCode"
                                value={formData.orgCode}
                                onChange={handleChange}
                                options={organisationOptions}
                                placeholder="Select Customer"
                                disabled={isSubmitting}
                                direction="down"
                                className={errors.orgCode ? 'border-red-500' : ''}
                            />
                            {errors.orgCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.orgCode}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label htmlFor="email">
                                Email <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter email address"
                                disabled={isSubmitting}
                                className={errors.email ? 'border-red-500' : ''}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">
                                Address <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter service center address (optional)"
                                disabled={isSubmitting}
                                className={errors.address ? 'border-red-500' : ''}
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                            )}
                        </div>

                        {/* Serviceable States */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="serviceableStates">
                                Serviceable States <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Input
                                id="serviceableStates"
                                name="serviceableStates"
                                value={formData.serviceableStates}
                                onChange={handleChange}
                                placeholder="Enter comma-separated states (e.g., Maharashtra, Gujarat, Rajasthan)"
                                disabled={isSubmitting}
                                className={errors.serviceableStates ? 'border-red-500' : ''}
                            />
                            <p className="text-xs text-gray-500">
                                Enter the states this service center can serve, separated by commas
                            </p>
                            {errors.serviceableStates && (
                                <p className="text-red-500 text-xs mt-1">{errors.serviceableStates}</p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    name="isActive"
                                    checked={formData.isActive}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                                    Active Service Center
                                </Label>
                            </div>
                            <p className="text-xs text-gray-500">
                                Uncheck to deactivate this service center
                            </p>
                        </div>

                        {/* MACSOFT Service Center */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isMacsoft"
                                    name="isMacsoft"
                                    checked={formData.isMacsoft}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <Label htmlFor="isMacsoft" className="text-sm font-medium text-gray-700">
                                    MACSOFT Head Service Center (HSC)
                                </Label>
                            </div>
                            <p className="text-xs text-gray-500">
                                Check if this is a MACSOFT-operated head service center
                            </p>
                        </div>

                        {/* MACSOFT Head Office Service Center */}
                        <div className="space-y-2">
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isMacsoftHead"
                                    name="isMacsoftHead"
                                    checked={formData.isMacsoftHead}
                                    onChange={handleChange}
                                    disabled={isSubmitting}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                                />
                                <Label htmlFor="isMacsoftHead" className="text-sm font-medium text-gray-700">
                                    MACSOFT Head Office
                                </Label>
                            </div>
                            <p className="text-xs text-gray-500">
                                Check if this is the main MACSOFT head office
                            </p>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();                                
                                // Reset form data
                                setFormData({
                                    name: '',
                                    orgCode: '',
                                    centerCode: '',
                                    email: '',
                                    address: '',
                                    serviceableStates: '',
                                    isActive: true,
                                    isMacsoft: false,
                                    isMacsoftHead: false,
                                });
                                setErrors({});
                                setIsSubmitting(false);
                                
                                // Close the modal
                                onOpenChange(false);
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
                                mode === 'create' ? 'Create Service Center' : 'Update Service Center'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ServiceCenterFormModal;