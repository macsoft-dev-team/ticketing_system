import { useEffect, useCallback } from "react";
import { useState } from "react";
import TitleHead from "../../components/TitleHead";
import ReusableTable from "../../components/ui/reusableTable";
import Header from "./components/header";
import axios from "axios";
import { API_ENDPOINTS } from "../../lib/constants/api";
import { debounceSearch } from "../../utils/debounce";
import { Wrench } from "lucide-react";
import { useToast } from "../../components/ui/toast";

export default function MotorHP() {
    const { addToast } = useToast();
    const [motorhps, setMotorHPs] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        label: "",
        value: "",
        sortOrder: "",
        active: true,
    });
    const [showDelete, setShowDelete] = useState(false);
    const [motorhpToDelete, setMotorHPToDelete] = useState(null);
    const [showUpdateModal, setShowUpdateModal] = useState(false);
    const [motorhpToEdit, setMotorHPToEdit] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [searchFilter, setSearchFilter] = useState('');
    const [loading, setLoading] = useState(false);
    const [totalCount, setTotalCount] = useState(0);

    const columnsData = [
        { key: "label", label: "Label", align: "left", textWrap: 'nowrap' },
        { key: "value", label: "Value (HP)", align: "left", textWrap: 'nowrap' },
        { key: "sortOrder", label: "Sort Order", align: "left", textWrap: 'nowrap' },
        { key: "createdAt", label: "Created", align: "left", textWrap: 'nowrap' },
    ];

    const handleShow = () => {
        setFormData({
            label: "",
            value: "",
            sortOrder: "",
            active: true,
        });
        setShowForm(true);
    };

    const handleClose = () => {
        setShowForm(false);
        setFormData({
            label: "",
            value: "",
            sortOrder: "",
            active: true,
        });
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const fetchMotorHPs = useCallback(async (page = 1, search = '') => {
        setLoading(true);
        try {
            const params = {
                take: 10,
                skip: page,
            };
            if (search) {
                params.filter = search;
            }

            const response = await axios.get(API_ENDPOINTS.motorhp, { params });
            setMotorHPs(response.data.motorhps || []);
            setTotalPages(response.data.totalPages || 0);
            setCurrentPage(page);
            setTotalCount(response.data.totalCount || 0);
        } catch (error) {
            console.error("Error fetching motor HPs:", error);
            setMotorHPs([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const debouncedSearch = useCallback(
        debounceSearch((searchTerm) => {
            setCurrentPage(1);
            fetchMotorHPs(1, searchTerm);
        }, 500),
        [fetchMotorHPs]
    );

    useEffect(() => {
        fetchMotorHPs(1);
    }, [fetchMotorHPs]);

    const handleSearchChange = (searchTerm) => {
        setSearchFilter(searchTerm);
        debouncedSearch(searchTerm);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                label: formData.label.trim(),
                value: parseInt(formData.value),
                sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : null,
                active: formData.active,
            };

            await axios.post(API_ENDPOINTS.motorhp, payload);
            handleClose();
            fetchMotorHPs(currentPage, searchFilter);
        } catch (error) {
            console.error("Error creating motor HP:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.error || "Failed to create motor HP",
                variant: "destructive"
            });
        }
    };

    const handleEdit = (motorhp) => {
        setMotorHPToEdit(motorhp);
        setFormData({
            label: motorhp.label,
            value: motorhp.value.toString(),
            sortOrder: motorhp.sortOrder?.toString() || "",
            active: motorhp.active,
        });
        setShowUpdateModal(true);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                label: formData.label.trim(),
                value: parseInt(formData.value),
                sortOrder: formData.sortOrder ? parseInt(formData.sortOrder) : null,
                active: formData.active,
            };

            await axios.put(`${API_ENDPOINTS.motorhp}/${motorhpToEdit.id}`, payload);
            setShowUpdateModal(false);
            setMotorHPToEdit(null);
            fetchMotorHPs(currentPage, searchFilter);
        } catch (error) {
            console.error("Error updating motor HP:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.error || "Failed to update motor HP",
                variant: "destructive"
            });
        }
    };

    const handleDeleteShow = (motorhp) => {
        setMotorHPToDelete(motorhp);
        setShowDelete(true);
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`${API_ENDPOINTS.motorhp}/${motorhpToDelete.id}`);
            setShowDelete(false);
            setMotorHPToDelete(null);
            fetchMotorHPs(currentPage, searchFilter);
        } catch (error) {
            console.error("Error deleting motor HP:", error);
            addToast({
                title: "Error",
                description: error.response?.data?.error || "Failed to delete motor HP",
                variant: "destructive"
            });
        }
    };

    const handlePageChange = (page) => {
        fetchMotorHPs(page, searchFilter);
    };

    const actionButtons = [
        {
            label: "Edit",
            onClick: handleEdit,
            className: "text-blue-600 hover:text-blue-800",
        },
        {
            label: "Delete",
            onClick: handleDeleteShow,
            className: "text-red-600 hover:text-red-800",
        },
    ];

    return (
        <div className="mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <Header
                onAddMotorHP={handleShow}
                onSearchChange={handleSearchChange}
                totalCount={totalCount}
            />

            <div className="bg-white rounded-lg shadow">
                <ReusableTable
                    data={motorhps}
                    columns={columnsData}
                    actions={actionButtons}
                    loading={loading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                    emptyMessage="No motor HP configurations found"
                    headerColor="bg-gray-700"
                    headerTextColor="text-white"
                    emptyIcon={<Wrench className="mx-auto h-12 w-12 text-gray-400" />}
                />
            </div>

            {/* Create Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/25 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                                Add New Motor HP
                            </h3>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Label *
                                    </label>
                                    <input
                                        type="text"
                                        name="label"
                                        value={formData.label}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 50HP"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Value *
                                    </label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 50"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        name="sortOrder"
                                        value={formData.sortOrder}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Active
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Create
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Update Modal */}
            {showUpdateModal && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3">
                            <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                                Update Motor HP
                            </h3>
                            <form onSubmit={handleUpdate} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Label *
                                    </label>
                                    <input
                                        type="text"
                                        name="label"
                                        value={formData.label}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 50HP"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Value *
                                    </label>
                                    <input
                                        type="number"
                                        name="value"
                                        value={formData.value}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 50"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                        min="1"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Sort Order
                                    </label>
                                    <input
                                        type="number"
                                        name="sortOrder"
                                        value={formData.sortOrder}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 1"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        min="0"
                                    />
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        name="active"
                                        checked={formData.active}
                                        onChange={handleInputChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label className="ml-2 block text-sm text-gray-700">
                                        Active
                                    </label>
                                </div>
                                <div className="flex justify-end space-x-2 pt-4">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setShowUpdateModal(false);
                                            setMotorHPToEdit(null);
                                        }}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        Update
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDelete && (
                <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
                    <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
                        <div className="mt-3 text-center">
                            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                            </div>
                            <h3 className="text-lg leading-6 font-medium text-gray-900 mt-2">Delete Motor HP</h3>
                            <div className="mt-2 px-7 py-3">
                                <p className="text-sm text-gray-500">
                                    Are you sure you want to delete "{motorhpToDelete?.label}"? This will deactivate the motor HP configuration.
                                </p>
                            </div>
                            <div className="flex justify-center space-x-2 pt-4">
                                <button
                                    onClick={() => {
                                        setShowDelete(false);
                                        setMotorHPToDelete(null);
                                    }}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}