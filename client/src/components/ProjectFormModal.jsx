import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button } from './ui/button';
import Input from './ui/input';
import { Label } from './ui/label';
import Select from './ui/select';
import useOrganisation from '../lib/hooks/useOrganisation';
import axios from 'axios';
import { API_URL } from '../lib/constants/api';

const ProjectFormModal = ({ open, onOpenChange, onSubmit, initialData = null, mode = 'create' }) => {
    const [formData, setFormData] = useState({
        name: '',
        projectCode: '',
        email: '',
        address: '',
        organisationId: '',
        stateId: '',
        isActive: true,
    });
    const [states,setStates] = useState([]);
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { organisations, getOrganisations } = useOrganisation();

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                projectCode: initialData.projectCode || '',
                email: initialData.email || '',
                address: initialData.address || '',
                organisationId: initialData.organisationId || '',
                stateId: initialData.stateId || '',
                isActive: initialData.isActive !== undefined ? initialData.isActive : true,
            });
        } else {
            setFormData({
                name: '',
                projectCode: '',
                email: '',
                address: '',
                organisationId: '',
                stateId: '',
                isActive: true,
            });
        }
        setErrors({});
    }, [initialData, open]);

    const getStates = async () => {
        try {
            const response = await axios.get(`${API_URL}/statesWA`);
            setStates(response.data);
        } catch (error) {
            console.error('Error fetching states:', error);
        }
    };

    // Fetch organisations when modal opens
    useEffect(() => {
        if (open) {
            getOrganisations({ skip: 0, take: 100, filter: null });
            getStates();
        }
    }, [open, getOrganisations]);

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
            newErrors.name = 'Project name is required';
        }

        if (!formData.projectCode.trim()) {
            newErrors.projectCode = 'Project code is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

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

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto modal-content">
                <DialogHeader>
                    <DialogTitle className="uppercase">
                        {mode === 'create' ? 'Create New Project' : 'Edit Project'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Project Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">
                                Project Name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Enter project name"
                                disabled={isSubmitting}
                                className={errors.name ? 'border-red-500' : ''}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Project Code */}
                        <div className="space-y-2">
                            <Label htmlFor="projectCode">
                                Project Code <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="projectCode"
                                name="projectCode"
                                value={formData.projectCode}
                                onChange={handleChange}
                                placeholder="Enter unique project code"
                                disabled={isSubmitting}
                                className={errors.projectCode ? 'border-red-500' : ''}
                            />
                            {errors.projectCode && (
                                <p className="text-red-500 text-xs mt-1">{errors.projectCode}</p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2 md:col-span-2">
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

                        {/* Organisation */}
                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="organisationId">
                                Customer/Organisation <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Select
                                id="organisationId"
                                name="organisationId"
                                value={formData.organisationId}
                                onChange={handleChange}
                                placeholder="Select customer/organisation (optional)"
                                options={organisations?.map(org => ({
                                    value: org.id,
                                    label: `${org.name} (${org.orgCode})`
                                })) || []}
                                disabled={isSubmitting}
                                className={errors.organisationId ? 'border-red-500' : ''}
                            />
                            {errors.organisationId && (
                                <p className="text-red-500 text-xs mt-1">{errors.organisationId}</p>
                            )}
                        </div>
                        {/* State */}
                        <div className="space-y-2">
                            <Label htmlFor="stateId">
                                State <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Select
                                id="stateId"
                                name="stateId"
                                value={formData.stateId}
                                onChange={handleChange}
                                placeholder="Select state (optional)"
                                options={Array.isArray(states) && states.length > 0 ? states.map(state => ({
                                    value: state.id,
                                    label: state.name
                                })) : []}
                                disabled={isSubmitting}
                                className={errors.stateId ? 'border-red-500' : ''}
                            />
                            {errors.stateId && (
                                <p className="text-red-500 text-xs mt-1">{errors.stateId}</p>
                            )}
                        </div>

                        {/* Address */}
                        <div className="space-y-2">
                            <Label htmlFor="address">
                                Address <span className="text-xs text-gray-500">(optional)</span>
                            </Label>
                            <Input
                                id="address"
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                placeholder="Enter project address (optional)"
                                disabled={isSubmitting}
                                className={errors.address ? 'border-red-500' : ''}
                            />
                            {errors.address && (
                                <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                            )}
                        </div>

                        {/* Active Status */}
                        <div className="space-y-2 md:col-span-2">
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
                                    Active Project
                                </Label>
                            </div>
                            <p className="text-xs text-gray-500">
                                Uncheck to deactivate this project
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
                                    projectCode: '',
                                    email: '',
                                    address: '',
                                    organisationId: '',
                                    isActive: true,
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
                                mode === 'create' ? 'Create Project' : 'Update Project'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ProjectFormModal;