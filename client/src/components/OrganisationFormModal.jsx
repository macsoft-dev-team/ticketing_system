import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import Input from './ui/input';
import Select from './ui/select';
import { Label } from './ui/label';

const OrganisationFormModal = ({ open, onOpenChange, onSubmit, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        name: '',
        orgCode: '',
        address: '',
        email: '',
        phone: '',
        status: 'ACTIVE',
    });

    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                orgCode: initialData.orgCode || '',
                address: initialData.address || '',
                email: initialData.email || '',
                phone: initialData.phone || '',
                status: initialData.status || 'ACTIVE',
            });
        } else {
            setFormData({
                name: '',
                orgCode: '',
                address: '',
                email: '',
                phone: '',
                status: 'ACTIVE',
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
            newErrors.name = 'Organisation name is required';
        }

        if (!formData.orgCode.trim()) {
            newErrors.orgCode = 'Organisation code is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

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
            const submitData = { 
                ...formData
                // Keep status as string for backend to handle
            };
            await onSubmit(submitData);
            // Don't call handleClose() here - let parent component handle modal closing
        } catch (error) {
            console.error('Form submission error:', error);
            // You could set form-level errors here if needed
        } finally {
            setIsSubmitting(false);
        }
    };

    const statusOptions = [
        { label: 'Active', value: 'ACTIVE' },
        { label: 'Inactive', value: 'INACTIVE' },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
                <DialogHeader>
                    <DialogTitle className="uppercase">
                        {mode === 'create' ? 'Create New Organisation' : 'Edit Organisation'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Organisation Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Organisation Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter organisation name"
                                disabled={isSubmitting}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Organisation Code */}
                        <div className="space-y-2">
                            <Label htmlFor="orgCode">
                                Organisation Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="orgCode"
                                name="orgCode"
                                value={formData.orgCode}
                                onChange={handleChange}
                                placeholder="Enter organisation code"
                                disabled={isSubmitting}
                                className={errors.orgCode ? 'border-red-500' : ''}
                            />
                            {errors.orgCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.orgCode}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="address">
                                Address <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter organisation address"
                                disabled={isSubmitting}
                                className={errors.address ? 'border-red-500' : ''}
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
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
                                Phone <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={handleChange}
                                placeholder="Enter phone number (optional)"
                                disabled={isSubmitting}
                                className={errors.phone ? 'border-red-500' : ''}
                            />
                            {errors.phone && (
                                <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
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
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('Cancel button clicked, isSubmitting:', isSubmitting);
                                if (!isSubmitting) {
                                    console.log('Resetting form data and closing modal');
                                    setFormData({
                                        name: '',
                                        orgCode: '',
                                        address: '',
                                        email: '',
                                        phone: '',
                                        status: 'ACTIVE',
                                    });
                                    setErrors({});
                                    onOpenChange(false);
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
                                mode === 'create' ? 'Create Organisation' : 'Update Organisation'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default OrganisationFormModal;