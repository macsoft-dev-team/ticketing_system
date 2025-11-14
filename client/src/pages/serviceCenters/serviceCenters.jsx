import ReusableTable from "../../components/ui/reusableTable";
import useServiceCenter from "../../lib/hooks/useServiceCenter";
import { useEffect, useState } from "react";
import moment from "moment";
import Header from "./components/header";
import UploadModal from "../../components/UploadModal";
import ServiceCenterFormModal from "../../components/ServiceCenterFormModal";
import ConfirmDialog from "../../components/ui/ConfirmDialog";

export default function ServiceCenters() {
    const [selectedServiceCenter, setSelectedServiceCenter] = useState(null);
    const [serviceCenterToDelete, setServiceCenterToDelete] = useState(null);
    const [uploadModalOpen, setUploadModalOpen] = useState(false);

    const columns = [
        { key: 'name', label: 'Name', align: 'left' },
        { key: 'centerCode', label: 'Center Code', align: 'left' },
        { key: 'email', label: 'Email', align: 'left' },
        { key: 'address', label: 'Address', align: 'left' },
        {
            key: 'status',
            label: 'Status',
            align: 'start',
        },
        {
            key: 'createdAt',
            label: 'Created Date',
            align: 'start',
        },
    ];

    const {
        serviceCenters,
        getServiceCenters,
        loading,
        filter,
        error,
        mode,
        statusCount,
        setMode,
        createServiceCenter,
        updateServiceCenter,
        deleteServiceCenter,
        uploadServiceCenters,
        setFilters
    } = useServiceCenter();

    useEffect(() => {
        getServiceCenters({ skip: 0, take: 10, filter: filter });
    }, [getServiceCenters, filter]);

    const handleCreate = () => {
        setSelectedServiceCenter(null);
        setMode('create');
    };

    const handleEdit = (row) => {
        setSelectedServiceCenter(row);
        setMode('edit');
    };

    const handleDelete = (row) => {
        setServiceCenterToDelete(row);
        setMode('delete');
    };

    const confirmDelete = async () => {
        if (serviceCenterToDelete) {
            try {
                await deleteServiceCenter(serviceCenterToDelete.id);
                setServiceCenterToDelete(null);
                setMode(null);
                // Refresh the list
                getServiceCenters({ skip: 0, take: 10 });
            } catch (error) {
                console.error("Error deleting service center:", error);
            }
        }
    };

    const handleFormSubmit = async (formData) => {
        try {
            if (mode === 'create') {
                await createServiceCenter(formData);
            } else if (mode === 'edit') {
                await updateServiceCenter({
                    ...formData,
                    id: selectedServiceCenter.id
                });
            }

            // Close the modal after successful submission
            setSelectedServiceCenter(null);
            setMode(null);

            // Refresh the list
            getServiceCenters({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error submitting form:", error);
            throw error; // Re-throw to let the form handle it
        }
    };

    const handleUpload = async (data) => {
        try {
            // Upload service centers directly
            await uploadServiceCenters(data);

            // Close modal and refresh the list
            setUploadModalOpen(false);
            setMode(null);
            getServiceCenters({ skip: 0, take: 10 });
        } catch (error) {
            console.error("Error uploading service centers:", error);
            throw error;
        }
    };

    const handleFilterChange = (status) => {
        console.log('Filter service centers by status:', status);
        setFilters({ ...filter, status });
    };

    const handleSearchChange = (search) => {
        console.log('Search service centers:', search);
        setFilters({ ...filter, search });
    };

    const handleUploadClick = () => {
        setMode('upload');
        setUploadModalOpen(true);
    };

    return (
        <section className="space-y-3">
            <Header
                onAddServiceCenter={handleCreate}
                onUploadServiceCenters={handleUploadClick}
                onFilterChange={handleFilterChange}
                onSearchChange={handleSearchChange}
            />

            <div className="px-6">
                {loading ? (
                    <div>Loading service centers...</div>
                ) : error ? (
                    <div className="text-red-500">Error: {error?.message || error}</div>
                ) : (
                    <ReusableTable
                        columns={columns}
                        data={serviceCenters || []}
                        title="Service Centers"
                        headerColor="bg-gray-700"
                        headerTextColor="text-white"
                        bordered
                        searchPlaceholder="Search service centers..."
                        onAdd={handleCreate}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                )}
            </div>

            {/* Create/Edit Service Center Modal */}
            <ServiceCenterFormModal
                open={mode === 'create' || mode === 'edit'}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        setSelectedServiceCenter(null);
                        setMode(null);
                    }
                }}
                onSubmit={handleFormSubmit}
                initialData={selectedServiceCenter}
                mode={mode === 'edit' ? 'edit' : 'create'}
            />

            {/* Upload Modal */}
            <UploadModal
                title="Upload Service Centers"
                description="Upload an Excel file to add multiple service centers at once."
                open={uploadModalOpen && mode === 'upload'}
                onOpenChange={(isOpen) => {
                    if (!isOpen) {
                        // Use local state to immediately close the modal
                        setUploadModalOpen(false);
                        // Also update Redux state
                        setMode(null);
                    }
                }}
                uploadDevice={handleUpload}
                requiredColumns={['name', 'centerCode', 'email', 'orgCode (optional)', 'address (optional)', 'serviceableStates (optional)', 'status (optional)']}
            />

            {/* Delete Confirmation Dialog */}
            <ConfirmDialog
                open={mode === 'delete'}
                title="Delete Service Center"
                description={`Are you sure you want to delete ${serviceCenterToDelete?.name}? This action cannot be undone.`}
                onConfirm={confirmDelete}
                onCancel={() => {
                    setServiceCenterToDelete(null);
                    setMode(null);
                }}
                confirmText="Delete"
                cancelText="Cancel"
                danger={true}
            />
        </section>
    );
}